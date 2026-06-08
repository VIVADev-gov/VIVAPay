import type { NextRequest } from "next/server";
import { ApiAuthError, requireApiAuth } from "@/app/api/_shared/api-auth";
import { errorResponse, successResponse } from "@/lib/httpHerlper";
import logger from "@/lib/logger";
import { profileService } from "../profile.service";

export async function POST(request: NextRequest) {
  try {
    const { publicUser } = await requireApiAuth(request);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return errorResponse("Debes adjuntar una imagen de firma", 400);
    }

    const user = await profileService.uploadSignature(publicUser.id, file);

    return successResponse("Firma guardada", { user }, 201);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error("[profile/firma/upload]", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return errorResponse(
      error instanceof Error ? error.message : "Error al guardar la firma",
      400
    );
  }
}
