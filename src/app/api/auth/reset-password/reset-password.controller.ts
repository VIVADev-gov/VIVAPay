import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/httpHerlper";
import logger from "@/lib/logger";
import { validateRequest } from "@/lib/validation";
import { AuthServiceError } from "../_shared/auth.errors";
import { resetPasswordBodySchema } from "./dto/reset-password.dto";
import { resetPasswordService } from "./reset-password.service";

export async function POST(request: NextRequest) {
  try {
    const validated = await validateRequest(request, resetPasswordBodySchema);
    if (!validated.success) return validated.error;

    const result = await resetPasswordService.reset(validated.data);
    return successResponse(result.message);
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    logger.error("[auth/reset-password]", error);
    return errorResponse("Error al restablecer la contraseña", 500);
  }
}
