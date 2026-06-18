import { Types } from "mongoose";
import { ORGANIZACION_TIPO } from "@/constants/organizacionViva";
import {
  contractRequiresReembolsables,
  derivePeriodoCorte,
  parsePaymentAccountReembolsables,
  type PaymentAccountReembolsables,
  type ReembolsablesPrefills,
} from "@/lib/cuentas-cobro/paymentAccountReembolsables";
import { resolveFormReviewer } from "@/lib/cuentas-cobro/resolveFormReviewer";
import { connectDB } from "@/lib/db/mongoose";
import { CuentaCobro, toPublicCuentaCobro } from "@/models/cuentaCobro";
import { Contrato, getCurrentContractSnapshot } from "@/models/contrato";
import { Municipio } from "@/models/municipio";
import { Subregion } from "@/models/subregion";
import { User } from "@/models/user";
import {
  PAYMENT_ACCOUNT_ERROR_CODES,
  PaymentAccountServiceError,
} from "./cuentas-cobro.errors";

function toDateIso(value?: Date | null) {
  return value ? value.toISOString() : null;
}

async function resolveReembolsablesContext(
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

  const [contract, contractor, account] = await Promise.all([
    Contrato.findOne({ _id: contractId, userId }).exec(),
    User.findById(userId).exec(),
    CuentaCobro.findOne({
      userId,
      contratoId: contractId,
      numero: numeroCuenta,
    }).exec(),
  ]);

  if (!contract || !contractor || !account) {
    throw new PaymentAccountServiceError(
      "No se encontró el contrato o la cuenta de cobro",
      404,
      PAYMENT_ACCOUNT_ERROR_CODES.CONTRACT_NOT_FOUND
    );
  }

  if (!contractRequiresReembolsables(contract)) {
    throw new PaymentAccountServiceError(
      "Este contrato no incluye reembolsables",
      400,
      PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_INVALID_STATE
    );
  }

  const reviewer = await resolveFormReviewer({
    organizationalUnitId: contractor.organizationalUnitId ?? "",
    organizationalUnitType: contractor.organizationalUnitType ?? "",
    subareaId: contractor.subareaId ?? null,
  });

  const current = getCurrentContractSnapshot(contract);
  const periodoInicio = toDateIso(account.periodoInicio);

  const prefills: ReembolsablesPrefills = {
    documentId: contractor.documentId,
    name: contractor.name,
    organizationalUnitName:
      contractor.subareaName?.trim() ||
      contractor.organizationalUnitName?.trim() ||
      "Sin unidad organizacional",
    numeroContrato: current.numeroContrato ?? contract.numeroContrato,
    rubroRembolsable: contract.rubroRembolsable?.trim() || null,
    conceptoRembolsable: contract.conceptoRembolsable?.trim() || null,
    periodoInicio,
    periodoFin: toDateIso(account.periodoFin),
    cuentaNumero: account.numero,
    coordinadorNombre: reviewer.name,
    modalidad: "CONTRATISTA",
    periodoCorte: derivePeriodoCorte(periodoInicio),
  };

  return { account, prefills };
}

async function validateEncargosAgainstCatalog(
  responses: PaymentAccountReembolsables
) {
  for (const encargo of responses.encargos) {
    if (!Types.ObjectId.isValid(encargo.municipioId)) {
      throw new PaymentAccountServiceError(
        "Municipio inválido en uno de los encargos",
        400
      );
    }

    if (!Types.ObjectId.isValid(encargo.subregionId)) {
      throw new PaymentAccountServiceError(
        "Subregión inválida en uno de los encargos",
        400
      );
    }

    const [municipio, subregion] = await Promise.all([
      Municipio.findOne({
        _id: encargo.municipioId,
        status: "activo",
      }).exec(),
      Subregion.findOne({
        _id: encargo.subregionId,
        status: "activo",
      }).exec(),
    ]);

    if (!municipio || !subregion) {
      throw new PaymentAccountServiceError(
        "El municipio o la subregión seleccionados no existen",
        400
      );
    }

    if (String(municipio.subregion) !== encargo.subregionId) {
      throw new PaymentAccountServiceError(
        `El municipio ${municipio.nombre} no pertenece a la subregión ${subregion.nombre}`,
        400
      );
    }

    if (municipio.nombre !== encargo.municipioNombre) {
      throw new PaymentAccountServiceError(
        "Los datos del municipio no coinciden con el catálogo",
        400
      );
    }

    if (subregion.nombre !== encargo.subregionNombre) {
      throw new PaymentAccountServiceError(
        "Los datos de la subregión no coinciden con el catálogo",
        400
      );
    }
  }
}

function validateReembolsablesBody(body: unknown): PaymentAccountReembolsables {
  const parsed = parsePaymentAccountReembolsables(body);
  if (!parsed) {
    throw new PaymentAccountServiceError(
      "Los datos de reembolsables son inválidos",
      400
    );
  }
  return parsed;
}

export const cuentasCobroReembolsablesService = {
  async getReembolsables(
    userId: string,
    contractId: string,
    numeroCuenta: number
  ) {
    const { account, prefills } = await resolveReembolsablesContext(
      userId,
      contractId,
      numeroCuenta
    );

    return {
      responses: parsePaymentAccountReembolsables(account.reembolsables),
      prefills,
    };
  },

  async saveReembolsables(
    userId: string,
    contractId: string,
    numeroCuenta: number,
    body: unknown
  ) {
    const responses = validateReembolsablesBody(body);
    const { account, prefills } = await resolveReembolsablesContext(
      userId,
      contractId,
      numeroCuenta
    );

    await validateEncargosAgainstCatalog(responses);

    account.reembolsables = responses;
    await account.save();

    return {
      responses,
      prefills,
      paymentAccount: toPublicCuentaCobro(account),
    };
  },
};
