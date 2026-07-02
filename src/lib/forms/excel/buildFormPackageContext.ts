import "server-only";

import { Types } from "mongoose";
import { ORGANIZACION_TIPO, contractorUsesSupervisorWorkflow } from "@/constants/organizacionViva";
import { parseGfrFo11Responses } from "@/lib/cuentas-cobro/gfrFo11Responses";
import { parsePaymentAccountReembolsables } from "@/lib/cuentas-cobro/paymentAccountReembolsables";
import { parsePaymentAccountDeclarations } from "@/lib/cuentas-cobro/paymentAccountDeclarations";
import { resolveFormOrdenador } from "@/lib/cuentas-cobro/resolveFormOrdenador";
import { resolveFormReviewer } from "@/lib/cuentas-cobro/resolveFormReviewer";
import {
  parseSeguridadSocialPlantillaMetadata,
  SEGURIDAD_SOCIAL_TIPO,
} from "@/lib/cuentas-cobro/seguridadSocialPlantilla";
import { connectDB } from "@/lib/db/mongoose";
import { CuentaCobro, type ICuentaCobroDocument } from "@/models/cuentaCobro";
import { CuentaCobroActividad } from "@/models/cuentaCobroActividad";
import {
  CUENTA_COBRO_DOCUMENT_SCOPE,
  CuentaCobroDocumento,
} from "@/models/cuentaCobroDocumento";
import {
  Contrato,
  getCurrentContractSnapshot,
  type IContratoDocument,
} from "@/models/contrato";
import { User, type IUserDocument } from "@/models/user";
import {
  parsePaymentAccountEjecucionGfrFo17Manuales,
} from "@/lib/cuentas-cobro/paymentAccountEjecucionGfrFo17";
import { parseIsoDate } from "./build/formExcelHelpers";
import type {
  FormContractSnapshot,
  FormPackageContext,
  FormPaymentAccountSnapshot,
} from "./types";

function toPaymentAccountSnapshot(
  account: ICuentaCobroDocument
): FormPaymentAccountSnapshot {
  return {
    id: String(account._id),
    numero: account.numero,
    estado: account.estado,
    periodoInicio: parseIsoDate(account.periodoInicio),
    periodoFin: parseIsoDate(account.periodoFin),
    valor: account.valor ?? null,
    fechaEnvio: parseIsoDate(account.fechaEnvio),
    enviadaCadAt: parseIsoDate(account.enviadaCadAt),
    fechaPago: parseIsoDate(account.fechaPago),
    declaracionesJuradas: parsePaymentAccountDeclarations(
      account.declaracionesJuradas
    ),
    gfrFo11: parseGfrFo11Responses(account.gfrFo11),
    reembolsables: parsePaymentAccountReembolsables(account.reembolsables),
    ejecucionGfrFo17Manuales: parsePaymentAccountEjecucionGfrFo17Manuales(
      account.ejecucionGfrFo17Manuales
    ),
  };
}

function toContractSnapshot(contract: IContratoDocument): FormContractSnapshot {
  const current = getCurrentContractSnapshot(contract);
  return {
    numeroContrato: current.numeroContrato ?? contract.numeroContrato,
    objeto: current.objeto ?? contract.objeto,
    plazoMeses: current.plazoMeses ?? contract.plazoMeses,
    fechaActaInicio: parseIsoDate(current.fechaActaInicio),
    fechaFinal: parseIsoDate(current.fechaFinal),
    concepto: current.concepto ?? contract.concepto,
    rubro: current.rubro ?? contract.rubro,
    cdp: current.cdp ?? contract.cdp,
    valorCdp: current.valorCdp ?? contract.valorCdp,
    rpc: current.rpc ?? contract.rpc,
    valorRpc: current.valorRpc ?? contract.valorRpc,
    valorInicialContrato:
      current.valorInicialContrato ?? contract.valorInicialContrato,
    numeroDisponibilidad:
      current.numeroDisponibilidad ?? contract.numeroDisponibilidad,
    numeroCompromiso: current.numeroCompromiso ?? contract.numeroCompromiso,
    totalRecursosComprometidos: current.totalRecursosComprometidos ?? 0,
    tieneReembolsables: contract.tieneReembolsables === true,
    rubroRembolsable: contract.rubroRembolsable?.trim() || null,
    conceptoRembolsable: contract.conceptoRembolsable?.trim() || null,
  };
}

export async function buildFormPackageContext(
  userId: string,
  contractId: string,
  numeroCuenta: number
): Promise<FormPackageContext> {
  await connectDB();

  if (!Types.ObjectId.isValid(contractId)) {
    throw new Error("Contrato no encontrado");
  }

  const [contract, contractor, account, paymentAccounts, activitiesDoc, documents] =
    await Promise.all([
      Contrato.findOne({ _id: contractId, userId }).exec(),
      User.findById(userId).exec(),
      CuentaCobro.findOne({
        userId,
        contratoId: contractId,
        numero: numeroCuenta,
      }).exec(),
      CuentaCobro.find({ userId, contratoId: contractId })
        .sort({ numero: 1 })
        .exec(),
      CuentaCobroActividad.findOne({
        userId,
        contratoId: contractId,
        numeroCuenta,
      }).exec(),
      CuentaCobroDocumento.find({
        userId,
        contratoId: contractId,
        numeroCuenta,
        scope: CUENTA_COBRO_DOCUMENT_SCOPE.CUENTA_COBRO,
      }).exec(),
    ]);

  if (!contract || !contractor || !account) {
    throw new Error("No se encontró el contrato o la cuenta de cobro");
  }

  const contractorOrg = {
    organizationalUnitId: contractor.organizationalUnitId ?? "",
    organizationalUnitType: contractor.organizationalUnitType ?? "",
    subareaId: contractor.subareaId ?? null,
  };

  const reviewerSignedUserId =
    contractorOrg.organizationalUnitType === ORGANIZACION_TIPO.JEFATURA
      ? account.jefeFirmadoPor
        ? String(account.jefeFirmadoPor)
        : null
      : !contractorUsesSupervisorWorkflow(contractorOrg) && account.directorFirmadoPor
        ? String(account.directorFirmadoPor)
        : null;

  const [reviewer, ordenador] = await Promise.all([
    resolveFormReviewer(contractorOrg, reviewerSignedUserId),
    resolveFormOrdenador(
      contractorOrg,
      contractor.organizationalUnitType === ORGANIZACION_TIPO.JEFATURA
        ? account.jefeFirmadoPor
          ? String(account.jefeFirmadoPor)
          : null
        : account.directorFirmadoPor
          ? String(account.directorFirmadoPor)
          : null
    ),
  ]);

  const seguridadSocialDocument = documents.find(
    (document) => document.tipoDocumento === SEGURIDAD_SOCIAL_TIPO
  );

  return {
    contract: toContractSnapshot(contract),
    contractor: toContractorSnapshot(contractor),
    reviewer,
    ordenador,
    paymentAccount: toPaymentAccountSnapshot(account),
    paymentAccounts: paymentAccounts.map(toPaymentAccountSnapshot),
    activities: (activitiesDoc?.actividades ?? []).map((activity) => ({
      actividad: activity.actividad,
      accion: activity.accion,
      soporteTipo: activity.soporteTipo,
      soporteTexto: activity.soporteTexto ?? null,
      soporteArchivoNombre: activity.soporteArchivoNombre ?? null,
      ejecucion: activity.ejecucion,
    })),
    seguridadSocialMetadata: parseSeguridadSocialPlantillaMetadata(
      seguridadSocialDocument?.metadata
    ),
  };
}

function toContractorSnapshot(contractor: IUserDocument) {
  return {
    id: String(contractor._id),
    name: contractor.name,
    documentId: contractor.documentId,
    organizationalUnitName: contractor.organizationalUnitName ?? "",
    organizationalUnitType: contractor.organizationalUnitType ?? "",
    organizationalUnitId: contractor.organizationalUnitId ?? "",
    subareaId: contractor.subareaId ?? null,
    signaturePath: contractor.signaturePath?.trim() || null,
  };
}
