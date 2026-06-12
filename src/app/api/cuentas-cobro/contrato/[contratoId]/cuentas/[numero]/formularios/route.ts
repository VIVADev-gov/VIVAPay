import type { NextRequest } from "next/server";
import { ApiAuthError, requireApiAuth } from "@/app/api/_shared/api-auth";
import { cuentasCobroFormsService } from "@/app/api/cuentas-cobro/forms.service";
import { errorResponse, successResponse } from "@/lib/httpHerlper";
import logger from "@/lib/logger";

function parseNumeroCuenta(value: string) {
  const numero = Number(value);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
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

    const body = (await request.json().catch(() => ({}))) as {
      sendEmail?: boolean;
      to?: string | string[];
    };

    const result = body.sendEmail
      ? await cuentasCobroFormsService.generateAndSendForms(
          publicUser.id,
          contratoId,
          numeroCuenta,
          body.to
        )
      : await cuentasCobroFormsService.generateForms(
          publicUser.id,
          contratoId,
          numeroCuenta
        );

    return successResponse(
      body.sendEmail
        ? "Formularios generados y enviados por correo"
        : "Formularios generados",
      result
    );
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error("[cuentas-cobro/formularios]", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return errorResponse(
      error instanceof Error ? error.message : "Error al generar formularios",
      500
    );
  }
}
