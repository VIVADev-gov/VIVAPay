import type { NextRequest } from "next/server";
import { ApiAuthError, requireApiAuth } from "@/app/api/_shared/api-auth";
import { errorResponse, successResponse } from "@/lib/httpHerlper";
import logger from "@/lib/logger";
import { cuentasCobroEjecucionGfrFo17Service } from "../../../../../ejecucion-gfr-fo-17.service";
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

    const result = await cuentasCobroEjecucionGfrFo17Service.getEjecucion(
      publicUser.id,
      contratoId,
      numeroCuenta
    );

    return successResponse("Ejecución GFR-FO-17 obtenida", result);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    if (error instanceof PaymentAccountServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error("[cuentas-cobro/ejecucion-gfr-fo-17/get]", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return errorResponse("Error al obtener ejecución GFR-FO-17", 500);
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
    const result = await cuentasCobroEjecucionGfrFo17Service.saveEjecucion(
      publicUser.id,
      contratoId,
      numeroCuenta,
      body
    );

    return successResponse("Ejecución GFR-FO-17 guardada", result);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    if (error instanceof PaymentAccountServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error("[cuentas-cobro/ejecucion-gfr-fo-17/save]", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return errorResponse("Error al guardar ejecución GFR-FO-17", 500);
  }
}
