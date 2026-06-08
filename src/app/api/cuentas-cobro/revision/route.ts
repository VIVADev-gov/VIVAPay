import type { NextRequest } from "next/server";
import { ApiAuthError, requireApiAuth } from "@/app/api/_shared/api-auth";
import { errorResponse, successResponse } from "@/lib/httpHerlper";
import logger from "@/lib/logger";
import { PaymentAccountServiceError } from "../cuentas-cobro.errors";
import { cuentasCobroWorkflowService } from "../workflow.service";

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireApiAuth(request);
    const result = await cuentasCobroWorkflowService.listForReviewer(
      cuentasCobroWorkflowService.toWorkflowActor(user)
    );

    return successResponse("Bandeja de revisión obtenida", result);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    if (error instanceof PaymentAccountServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error("[cuentas-cobro/revision]", error);
    return errorResponse("Error al obtener la bandeja de revisión", 500);
  }
}
