import type { NextRequest } from "next/server";
import { ApiAuthError, requireApiAuth } from "@/app/api/_shared/api-auth";
import { errorResponse, successResponse } from "@/lib/httpHerlper";
import logger from "@/lib/logger";
import { validateRequest } from "@/lib/validation";
import { updateProfileBodySchema } from "./dto/update-profile.dto";
import { profileService } from "./profile.service";

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireApiAuth(request);
    const profile = await profileService.getProfile(user);

    return successResponse("Perfil obtenido", { user: profile });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error("[profile/get]", error);
    return errorResponse("Error al obtener el perfil", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const validated = await validateRequest(request, updateProfileBodySchema);
    if (!validated.success) return validated.error;

    const { publicUser } = await requireApiAuth(request);
    const user = await profileService.updateProfile(
      publicUser.id,
      validated.data
    );

    return successResponse("Perfil actualizado", { user });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }

    logger.error("[profile/update]", error);
    return errorResponse("Error al actualizar el perfil", 500);
  }
}
