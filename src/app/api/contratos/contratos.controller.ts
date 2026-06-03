import type { NextRequest } from "next/server";
import { ApiAuthError, requireApiAuth } from "@/app/api/_shared/api-auth";
import { errorResponse, successResponse } from "@/lib/httpHerlper";
import logger from "@/lib/logger";
import { validateRequest } from "@/lib/validation";
import { createContractBodySchema } from "./dto/create-contract.dto";
import { ContractServiceError } from "./contratos.errors";
import { contratosService } from "./contratos.service";

export async function POST(request: NextRequest) {
  try {
    const validated = await validateRequest(request, createContractBodySchema);
    if (!validated.success) return validated.error;

    const { publicUser } = await requireApiAuth(request);
    const result = await contratosService.create(publicUser.id, validated.data);

    return successResponse(
      "Contrato creado correctamente",
      result,
      201
    );
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    if (error instanceof ContractServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error("[contratos/create]", error);
    return errorResponse("Error al crear el contrato", 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { publicUser } = await requireApiAuth(request);
    const result = await contratosService.listByUser(publicUser.id);

    return successResponse("Contratos obtenidos", result);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    if (error instanceof ContractServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error("[contratos/list]", error);
    return errorResponse("Error al obtener los contratos", 500);
  }
}
