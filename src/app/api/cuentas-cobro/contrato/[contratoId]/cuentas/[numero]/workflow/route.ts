import type { NextRequest } from "next/server";
import { z } from "zod";
import { ApiAuthError, requireApiAuth } from "@/app/api/_shared/api-auth";
import { CUENTA_COBRO_WORKFLOW_ACTION } from "@/constants/cuentaCobroWorkflow";
import { errorResponse, successResponse } from "@/lib/httpHerlper";
import logger from "@/lib/logger";
import { PaymentAccountServiceError } from "@/app/api/cuentas-cobro/cuentas-cobro.errors";
import { cuentasCobroWorkflowService } from "@/app/api/cuentas-cobro/workflow.service";

const workflowBodySchema = z.object({
  action: z.enum([
    CUENTA_COBRO_WORKFLOW_ACTION.SUBMIT,
    CUENTA_COBRO_WORKFLOW_ACTION.FORWARD_DIRECTOR,
    CUENTA_COBRO_WORKFLOW_ACTION.RETURN,
    CUENTA_COBRO_WORKFLOW_ACTION.DIRECTOR_SIGN,
    CUENTA_COBRO_WORKFLOW_ACTION.SEND_CAD,
    CUENTA_COBRO_WORKFLOW_ACTION.JEFE_APPROVE_SEND,
  ]),
  mensaje: z.string().trim().optional(),
});

type RouteContext = {
  params: Promise<{ contratoId: string; numero: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { contratoId, numero } = await context.params;
  const accountNumber = Number(numero);

  try {
    const { user } = await requireApiAuth(request);

    if (!Number.isInteger(accountNumber)) {
      logger.warn("[cuentas-cobro/workflow] Número de cuenta inválido", {
        contratoId,
        numero,
      });
      return errorResponse("Número de cuenta inválido", 400);
    }

    const body = workflowBodySchema.parse(await request.json());

    logger.info("[cuentas-cobro/workflow] POST recibido", {
      contratoId,
      accountNumber,
      action: body.action,
      userId: String(user._id),
      userRole: user.role,
    });

    const result = await cuentasCobroWorkflowService.runAction({
      actor: cuentasCobroWorkflowService.toWorkflowActor(user),
      contractId: contratoId,
      numero: accountNumber,
      action: body.action,
      mensaje: body.mensaje,
    });

    return successResponse("Flujo actualizado correctamente", result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("[cuentas-cobro/workflow] Body inválido", {
        contratoId,
        accountNumber,
        issues: error.issues,
      });
      return errorResponse(error.issues[0]?.message ?? "Datos inválidos", 400);
    }
    if (error instanceof ApiAuthError) {
      logger.warn("[cuentas-cobro/workflow] Auth error", {
        contratoId,
        accountNumber,
        message: error.message,
        code: error.code,
      });
      return errorResponse(error.message, error.statusCode, error.code);
    }
    if (error instanceof PaymentAccountServiceError) {
      logger.warn("[cuentas-cobro/workflow] Respuesta de error", {
        contratoId,
        accountNumber,
        message: error.message,
        statusCode: error.statusCode,
        code: error.code,
      });
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error("[cuentas-cobro/workflow] Error no controlado", {
      contratoId,
      accountNumber,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return errorResponse("Error al actualizar el flujo de la cuenta", 500);
  }
}
