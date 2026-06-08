import type { NextRequest } from "next/server";
import { ApiAuthError, requireApiAuth } from "@/app/api/_shared/api-auth";
import { errorResponse, successResponse } from "@/lib/httpHerlper";
import logger from "@/lib/logger";
import { cuentasCobroActividadesService } from "../../../../../actividades.service";
import { PaymentAccountServiceError } from "../../../../../cuentas-cobro.errors";

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

    const result = await cuentasCobroActividadesService.listActivities(
      publicUser.id,
      contratoId,
      numeroCuenta
    );

    return successResponse("Actividades de la cuenta obtenidas", result);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    if (error instanceof PaymentAccountServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error("[cuentas-cobro/actividades/list]", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return errorResponse("Error al obtener actividades de la cuenta", 500);
  }
}

export async function PUT(
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
    const payloadRaw = formData.get("payload");
    if (typeof payloadRaw !== "string") {
      return errorResponse("El payload de actividades es obligatorio", 400);
    }

    let payload: unknown;
    try {
      payload = JSON.parse(payloadRaw);
    } catch {
      return errorResponse("El payload de actividades no es JSON válido", 400);
    }

    const result = await cuentasCobroActividadesService.saveActivities({
      userId: publicUser.id,
      contractId: contratoId,
      numeroCuenta,
      payload,
      files: formData,
    });

    return successResponse("Actividades de la cuenta guardadas", result);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    if (error instanceof PaymentAccountServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error("[cuentas-cobro/actividades/save]", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return errorResponse("Error al guardar actividades de la cuenta", 500);
  }
}
