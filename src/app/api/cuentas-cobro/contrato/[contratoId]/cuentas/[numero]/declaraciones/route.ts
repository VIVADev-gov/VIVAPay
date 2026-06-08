import type { NextRequest } from "next/server";
import { ApiAuthError, requireApiAuth } from "@/app/api/_shared/api-auth";
import { errorResponse, successResponse } from "@/lib/httpHerlper";
import logger from "@/lib/logger";
import { cuentasCobroDeclaracionesService } from "../../../../../declaraciones.service";
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

    const result = await cuentasCobroDeclaracionesService.getDeclarations(
      publicUser.id,
      contratoId,
      numeroCuenta
    );

    return successResponse("Declaraciones juradas obtenidas", result);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    if (error instanceof PaymentAccountServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error("[cuentas-cobro/declaraciones/get]", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return errorResponse("Error al obtener declaraciones juradas", 500);
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

    const body = await request.json();
    const result = await cuentasCobroDeclaracionesService.saveDeclarations(
      publicUser.id,
      contratoId,
      numeroCuenta,
      body
    );

    return successResponse("Declaraciones juradas guardadas", result);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    if (error instanceof PaymentAccountServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error("[cuentas-cobro/declaraciones/save]", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return errorResponse("Error al guardar declaraciones juradas", 500);
  }
}
