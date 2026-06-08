import type { NextRequest } from "next/server";
import { ApiAuthError, requireApiAuth } from "@/app/api/_shared/api-auth";
import { errorResponse, successResponse } from "@/lib/httpHerlper";
import logger from "@/lib/logger";
import { PaymentAccountServiceError } from "../../../cuentas-cobro.errors";
import { cuentasCobroWorkflowService } from "../../../workflow.service";

type RouteContext = {
  params: Promise<{ contratoId: string; numero: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { user } = await requireApiAuth(request);
    const { contratoId, numero } = await context.params;
    const accountNumber = Number(numero);

    if (!Number.isInteger(accountNumber)) {
      return errorResponse("Número de cuenta inválido", 400);
    }

    const result = await cuentasCobroWorkflowService.getReviewDetail(
      cuentasCobroWorkflowService.toWorkflowActor(user),
      contratoId,
      accountNumber
    );

    return successResponse("Detalle de revisión obtenido", result);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    if (error instanceof PaymentAccountServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error("[cuentas-cobro/revision/detail]", error);
    return errorResponse("Error al obtener el detalle de revisión", 500);
  }
}
