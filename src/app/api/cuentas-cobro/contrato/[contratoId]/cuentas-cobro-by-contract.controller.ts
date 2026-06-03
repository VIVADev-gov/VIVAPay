import type { NextRequest } from "next/server";
import { ApiAuthError, requireApiAuth } from "@/app/api/_shared/api-auth";
import { errorResponse, successResponse } from "@/lib/httpHerlper";
import logger from "@/lib/logger";
import { PaymentAccountServiceError } from "../../cuentas-cobro.errors";
import { cuentasCobroService } from "../../cuentas-cobro.service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ contratoId: string }> }
) {
  try {
    const [{ publicUser }, { contratoId }] = await Promise.all([
      requireApiAuth(request),
      context.params,
    ]);
    const result = await cuentasCobroService.listByContract(
      publicUser.id,
      contratoId
    );

    return successResponse("Cuentas de cobro obtenidas", result);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    if (error instanceof PaymentAccountServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error("[cuentas-cobro/by-contract]", error);
    return errorResponse("Error al obtener las cuentas de cobro", 500);
  }
}
