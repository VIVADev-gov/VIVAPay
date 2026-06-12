import { Types } from "mongoose";
import {
  GFR_FO_11_UVT_THRESHOLD,
  parseGfrFo11Responses,
  type GfrFo11Responses,
} from "@/lib/cuentas-cobro/gfrFo11Responses";
import {
  includesGfrFo11,
  resolvePaymentPhase,
} from "@/lib/cuentas-cobro/paymentAccountRules";
import { getGfrFo11Config } from "@/lib/forms/excel/config/gfrFo11.config";
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

function getConfigMeta() {
  const config = getGfrFo11Config();
  return {
    uvtAnioAnterior: config.uvtAnioAnterior,
    uvtAnioActual: config.uvtAnioActual,
    anioAnterior: config.anioAnterior,
    anioActual: config.anioActual,
    uvtThreshold: GFR_FO_11_UVT_THRESHOLD,
  };
}

function validateGfrFo11Body(body: unknown): GfrFo11Responses {
  const parsed = parseGfrFo11Responses(body);
  if (!parsed) {
    throw new PaymentAccountServiceError(
      "Las respuestas del GFR-FO-11 son inválidas",
      400
    );
  }
  return parsed;
}

function assertGfrFo11Phase(
  paymentAccounts: ReturnType<typeof toPublicCuentaCobro>[],
  numeroCuenta: number
) {
  const account = paymentAccounts.find((item) => item.numero === numeroCuenta);
  if (!account) {
    throw new PaymentAccountServiceError(
      "Cuenta de cobro no encontrada",
      404,
      PAYMENT_ACCOUNT_ERROR_CODES.CONTRACT_NOT_FOUND
    );
  }

  const phase = resolvePaymentPhase(account, paymentAccounts);
  if (!includesGfrFo11(phase)) {
    throw new PaymentAccountServiceError(
      "El GFR-FO-11 solo aplica a la primera cuenta de cobro",
      400,
      PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_INVALID_STATE
    );
  }
}

export const cuentasCobroGfrFo11Service = {
  async getGfrFo11(userId: string, contractId: string, numeroCuenta: number) {
    const { account } = await resolveAccountForUser(
      userId,
      contractId,
      numeroCuenta
    );

    return {
      responses: parseGfrFo11Responses(account.gfrFo11),
      config: getConfigMeta(),
    };
  },

  async saveGfrFo11(
    userId: string,
    contractId: string,
    numeroCuenta: number,
    body: unknown
  ) {
    const responses = validateGfrFo11Body(body);
    const { account, paymentAccounts } = await resolveAccountForUser(
      userId,
      contractId,
      numeroCuenta
    );

    assertGfrFo11Phase(paymentAccounts, numeroCuenta);

    account.gfrFo11 = responses;
    await account.save();

    return {
      responses,
      config: getConfigMeta(),
    };
  },
};
