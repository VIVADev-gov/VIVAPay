import type { NextRequest } from "next/server";
import { ApiAuthError, requireApiAuth } from "@/app/api/_shared/api-auth";
import { errorResponse, successResponse } from "@/lib/httpHerlper";
import logger from "@/lib/logger";
import { ContractServiceError } from "../contratos.errors";
import { contratosService } from "../contratos.service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const [{ publicUser }, { id }] = await Promise.all([
      requireApiAuth(request),
      context.params,
    ]);
    const result = await contratosService.getByIdForUser(publicUser.id, id);

    return successResponse("Contrato obtenido", result);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    if (error instanceof ContractServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error("[contratos/detail]", error);
    return errorResponse("Error al obtener el contrato", 500);
  }
}
