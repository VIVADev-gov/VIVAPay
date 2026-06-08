import type { NextRequest } from "next/server";
import { ApiAuthError, requireApiAuth } from "@/app/api/_shared/api-auth";
import { errorResponse, successResponse } from "@/lib/httpHerlper";
import logger from "@/lib/logger";
import {
  cuentasCobroDocumentosService,
  parsePlantillaMetadataFromFormData,
} from "../../../../../documentos.service";
import { SEGURIDAD_SOCIAL_TIPO } from "@/lib/cuentas-cobro/seguridadSocialPlantilla";
import { PaymentAccountServiceError } from "../../../../../cuentas-cobro.errors";

function boolFromFormData(value: FormDataEntryValue | null) {
  return value === "true" || value === "1";
}

function parseNumeroCuenta(value: string) {
  const numero = Number(value);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ contratoId: string; numero: string }> }
) {
  try {
    const [{ publicUser }, { contratoId, numero }] = await Promise.all([
      requireApiAuth(request),
      context.params,
    ]);
    const numeroCuenta = parseNumeroCuenta(numero);
    if (!numeroCuenta) {
      return errorResponse("Número de cuenta inválido", 400);
    }

    const result = await cuentasCobroDocumentosService.listAccountDocuments(
      publicUser.id,
      contratoId,
      numeroCuenta
    );

    return successResponse("Documentos de la cuenta obtenidos", result);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    if (error instanceof PaymentAccountServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error("[cuentas-cobro/documentos-cuenta/list]", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return errorResponse("Error al obtener documentos de la cuenta", 500);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ contratoId: string; numero: string }> }
) {
  try {
    const [{ publicUser }, { contratoId, numero }] = await Promise.all([
      requireApiAuth(request),
      context.params,
    ]);
    const numeroCuenta = parseNumeroCuenta(numero);
    if (!numeroCuenta) {
      return errorResponse("Número de cuenta inválido", 400);
    }

    const formData = await request.formData();
    const fileEntry = formData.get("file");
    const file =
      fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;
    const tipoDocumento = String(formData.get("tipoDocumento") ?? "").trim();

    if (!tipoDocumento) {
      return errorResponse("El tipo de documento es obligatorio", 400);
    }

    const normalizedTipo = tipoDocumento.trim().toUpperCase();
    const plantillaMetadata =
      normalizedTipo === SEGURIDAD_SOCIAL_TIPO
        ? parsePlantillaMetadataFromFormData(formData)
        : null;

    if (!file && normalizedTipo !== SEGURIDAD_SOCIAL_TIPO) {
      return errorResponse("Debes adjuntar un archivo PDF", 400);
    }

    const result = await cuentasCobroDocumentosService.uploadAccountDocument({
      userId: publicUser.id,
      contractId: contratoId,
      numeroCuenta,
      file,
      tipoDocumento,
      required: boolFromFormData(formData.get("required")),
      plantillaMetadata,
    });

    return successResponse("Documento de la cuenta guardado", result, 201);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    if (error instanceof PaymentAccountServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error("[cuentas-cobro/documentos-cuenta/upload]", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return errorResponse("Error al guardar documento de la cuenta", 500);
  }
}
