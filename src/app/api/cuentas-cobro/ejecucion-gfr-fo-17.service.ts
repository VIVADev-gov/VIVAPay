import { Types } from "mongoose";
import { CONTRACTOR_EDITABLE_STATUSES } from "@/constants/cuentaCobroWorkflow";
import {
  buildPaymentAccountEjecucionGfrFo17Payload,
  parsePaymentAccountEjecucionGfrFo17Manuales,
  resolveAllPaymentAccountsEjecucionGfrFo17,
  resolvePaymentAccountEjecucionGfrFo17,
  type PaymentAccountEjecucionGfrFo17Manuales,
} from "@/lib/cuentas-cobro/paymentAccountEjecucionGfrFo17";
import { connectDB } from "@/lib/db/mongoose";
import { CuentaCobro, toPublicCuentaCobro } from "@/models/cuentaCobro";
import { Contrato } from "@/models/contrato";
import {
  PAYMENT_ACCOUNT_ERROR_CODES,
  PaymentAccountServiceError,
} from "./cuentas-cobro.errors";

async function resolveAccountForUser(
  userId: string,
  contractId: string,
  numeroCuenta: number
) {
  await connectDB();

  if (!Types.ObjectId.isValid(contractId)) {
    throw new PaymentAccountServiceError(
      "Contrato no encontrado",
      404,
      PAYMENT_ACCOUNT_ERROR_CODES.CONTRACT_NOT_FOUND
    );
  }

  const contract = await Contrato.findOne({ _id: contractId, userId }).exec();
  if (!contract) {
    throw new PaymentAccountServiceError(
      "Contrato no encontrado",
      404,
      PAYMENT_ACCOUNT_ERROR_CODES.CONTRACT_NOT_FOUND
    );
  }

  const account = await CuentaCobro.findOne({
    userId,
    contratoId: contract._id,
    numero: numeroCuenta,
  }).exec();

  if (!account) {
    throw new PaymentAccountServiceError(
      "Cuenta de cobro no encontrada",
      404,
      PAYMENT_ACCOUNT_ERROR_CODES.CONTRACT_NOT_FOUND
    );
  }

  const paymentAccounts = await CuentaCobro.find({
    userId,
    contratoId: contract._id,
  })
    .sort({ numero: 1 })
    .exec();

  return {
    account,
    paymentAccounts: paymentAccounts.map(toPublicCuentaCobro),
  };
}

function assertAccountEditable(estado: string) {
  if (!CONTRACTOR_EDITABLE_STATUSES.includes(estado as never)) {
    throw new PaymentAccountServiceError(
      "La cuenta no se puede editar en su estado actual",
      409,
      PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_INVALID_STATE
    );
  }
}

function buildEjecucionResponse(
  paymentAccounts: ReturnType<typeof toPublicCuentaCobro>[],
  numeroCuenta: number
) {
  const allAccounts = resolveAllPaymentAccountsEjecucionGfrFo17(paymentAccounts);
  const current = paymentAccounts.find((account) => account.numero === numeroCuenta);

  if (!current) {
    throw new PaymentAccountServiceError(
      "Cuenta de cobro no encontrada",
      404,
      PAYMENT_ACCOUNT_ERROR_CODES.CONTRACT_NOT_FOUND
    );
  }

  return {
    ejecucionGfrFo17Manuales: current.ejecucionGfrFo17Manuales ?? null,
    resolved: resolvePaymentAccountEjecucionGfrFo17(current, paymentAccounts),
    allAccounts: allAccounts.map((item) => ({
      numero: item.numero,
      resolved: {
        sugerida: item.sugerida,
        efectiva: item.efectiva,
        manuales: item.manuales,
        esPersonalizada: item.esPersonalizada,
      },
    })),
  };
}

function validateEjecucionBody(
  body: unknown,
  paymentAccounts: ReturnType<typeof toPublicCuentaCobro>[],
  numeroCuenta: number
): PaymentAccountEjecucionGfrFo17Manuales | null {
  if (!body || typeof body !== "object") {
    throw new PaymentAccountServiceError(
      "Los porcentajes de ejecución son inválidos",
      400
    );
  }

  const record = body as Record<string, unknown>;
  const current = paymentAccounts.find((account) => account.numero === numeroCuenta);
  if (!current) {
    throw new PaymentAccountServiceError(
      "Cuenta de cobro no encontrada",
      404,
      PAYMENT_ACCOUNT_ERROR_CODES.CONTRACT_NOT_FOUND
    );
  }

  const suggested = resolvePaymentAccountEjecucionGfrFo17(
    current,
    paymentAccounts
  ).sugerida;

  const porcentajeRaw =
    record.porcentaje ?? record.fisica ?? record.financiera;

  const { ejecucionGfrFo17Manuales, error } = buildPaymentAccountEjecucionGfrFo17Payload({
    porcentaje: Number(porcentajeRaw),
    suggested,
  });

  if (error) {
    throw new PaymentAccountServiceError(error, 400);
  }

  return ejecucionGfrFo17Manuales;
}

export const cuentasCobroEjecucionGfrFo17Service = {
  async getEjecucion(
    userId: string,
    contractId: string,
    numeroCuenta: number
  ) {
    const { paymentAccounts } = await resolveAccountForUser(
      userId,
      contractId,
      numeroCuenta
    );

    return buildEjecucionResponse(paymentAccounts, numeroCuenta);
  },

  async saveEjecucion(
    userId: string,
    contractId: string,
    numeroCuenta: number,
    body: unknown
  ) {
    const { account, paymentAccounts } = await resolveAccountForUser(
      userId,
      contractId,
      numeroCuenta
    );

    assertAccountEditable(account.estado);

    const ejecucionGfrFo17Manuales = validateEjecucionBody(
      body,
      paymentAccounts,
      numeroCuenta
    );

    account.ejecucionGfrFo17Manuales = ejecucionGfrFo17Manuales;
    account.markModified("ejecucionGfrFo17Manuales");
    await account.save();

    const updatedAccounts = paymentAccounts.map((item) =>
      item.numero === numeroCuenta
        ? {
            ...item,
            ejecucionGfrFo17Manuales:
              parsePaymentAccountEjecucionGfrFo17Manuales(
                account.ejecucionGfrFo17Manuales
              ),
          }
        : item
    );

    return buildEjecucionResponse(updatedAccounts, numeroCuenta);
  },
};
