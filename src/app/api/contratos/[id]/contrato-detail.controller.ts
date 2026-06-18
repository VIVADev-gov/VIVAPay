import type { NextRequest } from "next/server";
import { ApiAuthError, requireApiAuth } from "@/app/api/_shared/api-auth";
import { errorResponse, successResponse } from "@/lib/httpHerlper";
import logger from "@/lib/logger";
import { validateRequest } from "@/lib/validation";
import { updateContractBodySchema } from "../dto/update-contract.dto";
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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const validated = await validateRequest(request, updateContractBodySchema);
    if (!validated.success) return validated.error;

    const [{ publicUser }, { id }] = await Promise.all([
      requireApiAuth(request),
      context.params,
    ]);

    const result = await contratosService.update(
      publicUser.id,
      publicUser.name,
      id,
      validated.data
    );

    return successResponse("Contrato actualizado correctamente", result);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    if (error instanceof ContractServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error(
      "[contratos/update]",
      error instanceof Error ? error.message : error,
      error
    );
    return errorResponse("Error al actualizar el contrato", 500);
  }
}
