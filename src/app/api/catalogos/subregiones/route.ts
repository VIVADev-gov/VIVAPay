import type { NextRequest } from "next/server";
import { ApiAuthError, requireApiAuth } from "@/app/api/_shared/api-auth";
import { errorResponse, successResponse } from "@/lib/httpHerlper";
import logger from "@/lib/logger";
import { catalogosService } from "../catalogos.service";

export async function GET(request: NextRequest) {
  try {
    await requireApiAuth(request);
    const subregiones = await catalogosService.listSubregiones();
    return successResponse("Subregiones obtenidas", { subregiones });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error("[catalogos/subregiones/get]", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return errorResponse("Error al obtener subregiones", 500);
  }
}
