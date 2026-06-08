import { Types } from "mongoose";
import { generatePaymentAccountsForContract } from "@/lib/contratos/generatePaymentAccounts";
import { connectDB } from "@/lib/db/mongoose";
import { enrichContractWithPaymentStats } from "@/lib/contratos/contractStats";
import {
  CUENTA_COBRO_STATUS,
  CuentaCobro,
  toPublicCuentaCobro,
  type CuentaCobroStatus,
} from "@/models/cuentaCobro";
import {
  Contrato,
  getCurrentContractSnapshot,
  toPublicContrato,
} from "@/models/contrato";
import {
  PAYMENT_ACCOUNT_ERROR_CODES,
  PaymentAccountServiceError,
} from "./cuentas-cobro.errors";

const NEXT_PAYMENT_STATUSES: CuentaCobroStatus[] = [
  CUENTA_COBRO_STATUS.BORRADOR,
  CUENTA_COBRO_STATUS.PENDIENTE,
  CUENTA_COBRO_STATUS.HABILITADA,
];

const DONE_PAYMENT_STATUSES: CuentaCobroStatus[] = [
  CUENTA_COBRO_STATUS.ENVIADA,
  CUENTA_COBRO_STATUS.APROBADA,
  CUENTA_COBRO_STATUS.RECHAZADA,
];

async function resolveContractForUser(userId: string, contractId: string) {
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

  return contract;
}

export const cuentasCobroService = {
  async getSummary(userId: string) {
    await connectDB();

    const contratos = await Contrato.find({ userId }).exec();
    const today = new Date();

    const [nextPaymentAccount, lastPaymentAccount] = await Promise.all([
      CuentaCobro.findOne({
        userId,
        estado: { $in: NEXT_PAYMENT_STATUSES },
      })
        .sort({ contratoId: 1, numero: 1, fechaHabilitadaEnvio: 1 })
        .exec(),
      CuentaCobro.findOne({
        userId,
        estado: { $in: DONE_PAYMENT_STATUSES },
      })
        .sort({ numero: -1, fechaEnvio: -1, updatedAt: -1 })
        .exec(),
    ]);

    const dateBasedContractDoc =
      contratos.find((contrato) => {
        const current = getCurrentContractSnapshot(contrato);
        return Boolean(
          current.fechaActaInicio &&
            current.fechaFinal &&
            current.fechaActaInicio <= today &&
            current.fechaFinal >= today
        );
      }) ?? null;

    const pendingContractDoc = nextPaymentAccount
      ? (contratos.find(
          (contrato) =>
            String(contrato._id) === String(nextPaymentAccount.contratoId)
        ) ?? null)
      : null;

    const currentContractDoc = dateBasedContractDoc ?? pendingContractDoc;

    const completedAllPaymentAccounts =
      !nextPaymentAccount && Boolean(lastPaymentAccount);

    let currentContract = null;
    if (currentContractDoc) {
      const accounts = await CuentaCobro.find({
        contratoId: currentContractDoc._id,
      })
        .select("estado")
        .lean()
        .exec();
      currentContract = enrichContractWithPaymentStats(
        toPublicContrato(currentContractDoc),
        accounts
      );
    }

    return {
      currentContract,
      nextPaymentAccount: nextPaymentAccount
        ? toPublicCuentaCobro(nextPaymentAccount)
        : null,
      lastPaymentAccount: lastPaymentAccount
        ? toPublicCuentaCobro(lastPaymentAccount)
        : null,
      completedAllPaymentAccounts,
      message: completedAllPaymentAccounts
        ? "Se han realizado todas las cuentas de cobro registradas."
        : null,
    };
  },

  async listByContract(userId: string, contractId: string) {
    await connectDB();

    const contract = await resolveContractForUser(userId, contractId);

    const paymentAccounts = await CuentaCobro.find({
      userId,
      contratoId: contract._id,
    })
      .sort({ numero: -1 })
      .exec();

    const publicContract = enrichContractWithPaymentStats(
      toPublicContrato(contract),
      paymentAccounts
    );

    return {
      contract: publicContract,
      paymentAccounts: paymentAccounts.map(toPublicCuentaCobro),
    };
  },

  async regenerateByContract(userId: string, contractId: string) {
    await connectDB();

    const contract = await resolveContractForUser(userId, contractId);
    const existingAccounts = await CuentaCobro.find({
      userId,
      contratoId: contract._id,
    }).exec();

    const hasDoneAccounts = existingAccounts.some((account) =>
      DONE_PAYMENT_STATUSES.includes(account.estado)
    );

    if (hasDoneAccounts) {
      throw new PaymentAccountServiceError(
        "No se pueden regenerar cuentas porque ya hay cuentas enviadas, aprobadas o rechazadas",
        409,
        PAYMENT_ACCOUNT_ERROR_CODES.REGENERATION_BLOCKED
      );
    }

    const current = getCurrentContractSnapshot(contract);
    const fechaActaInicio = current.fechaActaInicio ?? contract.fechaActaInicio;
    const fechaFinal = current.fechaFinal ?? contract.fechaFinal;
    const plazoMeses = current.plazoMeses ?? contract.plazoMeses;
    const valorTotal =
      current.totalRecursosComprometidos ??
      current.valorRpc ??
      current.valorInicialContrato ??
      contract.valorInicialContrato;

    await CuentaCobro.deleteMany({
      userId,
      contratoId: contract._id,
      estado: { $in: NEXT_PAYMENT_STATUSES },
    });

    const generated = await generatePaymentAccountsForContract({
      userId: contract.userId,
      contratoId: contract._id as Types.ObjectId,
      fechaActaInicio,
      fechaFinal,
      plazoMeses,
      valorTotal,
    });

    const publicContract = enrichContractWithPaymentStats(
      toPublicContrato(contract),
      generated
    );

    return {
      contract: publicContract,
      paymentAccounts: generated.map(toPublicCuentaCobro),
      paymentAccountsGenerated: generated.length,
    };
  },
};
