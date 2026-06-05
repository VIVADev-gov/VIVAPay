import type { NextRequest } from "next/server";
import { ApiAuthError, requireApiAuth } from "@/app/api/_shared/api-auth";
import { errorResponse, successResponse } from "@/lib/httpHerlper";
import logger from "@/lib/logger";
import { cuentasCobroDocumentosService } from "../../../documentos.service";
import { PaymentAccountServiceError } from "../../../cuentas-cobro.errors";

function boolFromFormData(value: FormDataEntryValue | null) {
  return value === "true" || value === "1";
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ contratoId: string }> }
) {
  try {
    const [{ publicUser }, { contratoId }] = await Promise.all([
      requireApiAuth(request),
      context.params,
    ]);
    const result = await cuentasCobroDocumentosService.listContractDocuments(
      publicUser.id,
      contratoId
    );

    return successResponse("Documentos del contrato obtenidos", result);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    if (error instanceof PaymentAccountServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error("[cuentas-cobro/documentos-contrato/list]", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return errorResponse("Error al obtener documentos del contrato", 500);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ contratoId: string }> }
) {
  try {
    const [{ publicUser }, { contratoId }] = await Promise.all([
      requireApiAuth(request),
      context.params,
    ]);
    const formData = await request.formData();
    const file = formData.get("file");
    const tipoDocumento = String(formData.get("tipoDocumento") ?? "").trim();

    if (!(file instanceof File)) {
      return errorResponse("Debes adjuntar un archivo PDF", 400);
    }
    if (!tipoDocumento) {
      return errorResponse("El tipo de documento es obligatorio", 400);
    }

    const result = await cuentasCobroDocumentosService.uploadContractDocument({
      userId: publicUser.id,
      contractId: contratoId,
      file,
      tipoDocumento,
      required: boolFromFormData(formData.get("required")),
    });

    return successResponse("Documento del contrato guardado", result, 201);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    if (error instanceof PaymentAccountServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error("[cuentas-cobro/documentos-contrato/upload]", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return errorResponse("Error al guardar documento del contrato", 500);
  }
}
