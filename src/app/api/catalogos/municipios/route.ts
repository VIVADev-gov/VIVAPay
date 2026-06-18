import type { NextRequest } from "next/server";
import { ApiAuthError, requireApiAuth } from "@/app/api/_shared/api-auth";
import { errorResponse, successResponse } from "@/lib/httpHerlper";
import logger from "@/lib/logger";
import { catalogosService } from "../catalogos.service";

export async function GET(request: NextRequest) {
  try {
    await requireApiAuth(request);
    const subregionId = request.nextUrl.searchParams.get("subregionId");
    const municipios = await catalogosService.listMunicipios(subregionId);
    return successResponse("Municipios obtenidos", { municipios });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error("[catalogos/municipios/get]", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return errorResponse("Error al obtener municipios", 500);
  }
}
