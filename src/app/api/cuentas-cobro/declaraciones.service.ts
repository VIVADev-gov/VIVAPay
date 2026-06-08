import { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import {
  parsePaymentAccountDeclarations,
  type PaymentAccountDeclarations,
} from "@/lib/cuentas-cobro/paymentAccountDeclarations";
import { CuentaCobro } from "@/models/cuentaCobro";
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

  return account;
}

function validateDeclarationsBody(body: unknown): PaymentAccountDeclarations {
  const parsed = parsePaymentAccountDeclarations(body);
  if (!parsed) {
    throw new PaymentAccountServiceError(
      "Las declaraciones juradas son inválidas",
      400
    );
  }
  return parsed;
}

export const cuentasCobroDeclaracionesService = {
  async getDeclarations(
    userId: string,
    contractId: string,
    numeroCuenta: number
  ) {
    const account = await resolveAccountForUser(userId, contractId, numeroCuenta);
    const declarations = parsePaymentAccountDeclarations(
      account.declaracionesJuradas
    );

    return { declarations };
  },

  async saveDeclarations(
    userId: string,
    contractId: string,
    numeroCuenta: number,
    body: unknown
  ) {
    const declarations = validateDeclarationsBody(body);
    const account = await resolveAccountForUser(userId, contractId, numeroCuenta);

    account.declaracionesJuradas = declarations;
    await account.save();

    return { declarations };
  },
};
