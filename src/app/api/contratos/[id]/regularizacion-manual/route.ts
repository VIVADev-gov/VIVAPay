import type { NextRequest } from "next/server";
import { ApiAuthError, requireApiAuth } from "@/app/api/_shared/api-auth";
import { errorResponse, successResponse } from "@/lib/httpHerlper";
import logger from "@/lib/logger";
import { validateRequest } from "@/lib/validation";
import { updateManualRegularizationBodySchema } from "../../dto/update-manual-regularization.dto";
import { ContractServiceError } from "../../contratos.errors";
import { contratosService } from "../../contratos.service";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const validated = await validateRequest(
      request,
      updateManualRegularizationBodySchema
    );
    if (!validated.success) return validated.error;

    const [{ publicUser }, { id }] = await Promise.all([
      requireApiAuth(request),
      context.params,
    ]);

    const result = await contratosService.updateManualRegularization(
      publicUser.id,
      id,
      validated.data
    );

    return successResponse(
      "Regularización manual actualizada correctamente",
      result
    );
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    if (error instanceof ContractServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error("[contratos/manual-regularization]", error);
    return errorResponse("Error al actualizar la regularización manual", 500);
  }
}
