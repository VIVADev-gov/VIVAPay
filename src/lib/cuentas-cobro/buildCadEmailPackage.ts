import "server-only";

import fs from "fs/promises";
import path from "path";
import { Types } from "mongoose";
import {
  getPaymentDocumentLabel,
  getPaymentDocumentRequirements,
  resolvePaymentPhase,
} from "@/lib/cuentas-cobro/paymentAccountRules";
import type { CadEmailAttachment } from "@/lib/cuentas-cobro/cadEmailAttachment";
import { connectDB } from "@/lib/db/mongoose";
import { buildFormPackage } from "@/lib/forms/excel/buildFormPackage";
import { buildFormPackageContext } from "@/lib/forms/excel/buildFormPackageContext";
import type { FormPackageContext } from "@/lib/forms/excel/types";
import logger from "@/lib/logger";
import { resolveReadableUploadAbsolutePath } from "@/lib/uploadsStorage";
import {
  CUENTA_COBRO_DOCUMENT_SCOPE,
  CuentaCobroDocumento,
  type ICuentaCobroDocumentoDocument,
} from "@/models/cuentaCobroDocumento";
import { CuentaCobro, toPublicCuentaCobro } from "@/models/cuentaCobro";

export type BuildCadEmailPackageResult =
  | {
      success: true;
      attachments: CadEmailAttachment[];
      context: FormPackageContext;
    }
  | {
      success: false;
      error: string;
    };

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

function resolveAttachmentFilename(
  document: ICuentaCobroDocumentoDocument,
  numeroCuenta: number
) {
  if (document.originalName?.trim()) {
    return sanitizeFilename(document.originalName.trim());
  }

  const label = getPaymentDocumentLabel(document.tipoDocumento);
  const ext = path.extname(document.filePath) || ".pdf";
  return sanitizeFilename(`${label}-cuenta-${numeroCuenta}${ext}`);
}

async function readUploadedDocument(
  document: ICuentaCobroDocumentoDocument,
  numeroCuenta: number
): Promise<CadEmailAttachment | null> {
  const absolutePath = await resolveReadableUploadAbsolutePath(document.filePath);
  if (!absolutePath) {
    logger.warn("[cuentas-cobro/cad-package] Archivo no encontrado en disco", {
      tipoDocumento: document.tipoDocumento,
      filePath: document.filePath,
    });
    return null;
  }

  try {
    const buffer = await fs.readFile(absolutePath);
    if (buffer.length === 0) {
      logger.warn("[cuentas-cobro/cad-package] Archivo vacío", {
        tipoDocumento: document.tipoDocumento,
        filePath: document.filePath,
      });
      return null;
    }

    return {
      code: document.tipoDocumento,
      filename: resolveAttachmentFilename(document, numeroCuenta),
      buffer,
      contentType: document.mimeType?.trim() || "application/pdf",
    };
  } catch (error) {
    logger.warn("[cuentas-cobro/cad-package] Error leyendo archivo", {
      tipoDocumento: document.tipoDocumento,
      filePath: document.filePath,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function buildCadEmailPackage(
  userId: string,
  contractId: string,
  numeroCuenta: number
): Promise<BuildCadEmailPackageResult> {
  if (!Types.ObjectId.isValid(contractId)) {
    return { success: false, error: "Contrato no encontrado" };
  }

  const [formPackageResult, context] = await Promise.all([
    buildFormPackage(userId, contractId, numeroCuenta),
    buildFormPackageContext(userId, contractId, numeroCuenta),
  ]);

  if (!formPackageResult.success) {
    return { success: false, error: formPackageResult.error };
  }

  await connectDB();

  const paymentAccounts = await CuentaCobro.find({
    userId,
    contratoId: contractId,
  })
    .sort({ numero: 1 })
    .exec();

  const paymentAccount = paymentAccounts.find((item) => item.numero === numeroCuenta);
  if (!paymentAccount) {
    return { success: false, error: "Cuenta de cobro no encontrada" };
  }

  const phase = resolvePaymentPhase(
    toPublicCuentaCobro(paymentAccount),
    paymentAccounts.map(toPublicCuentaCobro)
  );
  const requirements = getPaymentDocumentRequirements(phase);

  const includeContractDocs = requirements.some((item) => item.scope === "contract");
  const accountRequirementTypes = requirements
    .filter((item) => item.scope === "account")
    .map((item) => item.tipoDocumento);

  const [contractDocuments, accountDocuments] = await Promise.all([
    includeContractDocs
      ? CuentaCobroDocumento.find({
          userId,
          contratoId: contractId,
          scope: CUENTA_COBRO_DOCUMENT_SCOPE.CONTRATO,
        })
          .sort({ tipoDocumento: 1 })
          .exec()
      : Promise.resolve([]),
    accountRequirementTypes.length > 0
      ? CuentaCobroDocumento.find({
          userId,
          contratoId: contractId,
          numeroCuenta,
          scope: CUENTA_COBRO_DOCUMENT_SCOPE.CUENTA_COBRO,
          tipoDocumento: { $in: accountRequirementTypes },
        })
          .sort({ tipoDocumento: 1 })
          .exec()
      : Promise.resolve([]),
  ]);

  const requiredContractTypes = new Set(
    requirements
      .filter((item) => item.scope === "contract" && item.required)
      .map((item) => item.tipoDocumento)
  );
  const requiredAccountTypes = new Set(
    requirements
      .filter((item) => item.scope === "account" && item.required)
      .map((item) => item.tipoDocumento)
  );

  const documentsToAttach = [
    ...contractDocuments.filter((doc) =>
      requiredContractTypes.has(doc.tipoDocumento)
    ),
    ...accountDocuments.filter((doc) =>
      requiredAccountTypes.has(doc.tipoDocumento)
    ),
  ];

  const uploadedAttachments = (
    await Promise.all(
      documentsToAttach.map((document) =>
        readUploadedDocument(document, numeroCuenta)
      )
    )
  ).filter((item): item is CadEmailAttachment => item !== null);

  const formAttachments: CadEmailAttachment[] = formPackageResult.attachments.map(
    (item) => ({
      code: item.code,
      filename: item.filename,
      buffer: item.buffer,
      contentType: "application/pdf",
    })
  );

  const attachments = [...formAttachments, ...uploadedAttachments];

  if (attachments.length === 0) {
    return {
      success: false,
      error: "No se pudo construir ningún adjunto para el envío al CAD",
    };
  }

  return {
    success: true,
    attachments,
    context,
  };
}
