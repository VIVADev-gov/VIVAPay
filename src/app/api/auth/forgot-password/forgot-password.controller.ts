import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/httpHerlper";
import logger from "@/lib/logger";
import { validateRequest } from "@/lib/validation";
import { AuthServiceError } from "../_shared/auth.errors";
import { forgotPasswordBodySchema } from "./dto/forgot-password.dto";
import { forgotPasswordService } from "./forgot-password.service";

export async function POST(request: NextRequest) {
  try {
    const validated = await validateRequest(request, forgotPasswordBodySchema);
    if (!validated.success) return validated.error;

    const result = await forgotPasswordService.requestReset(validated.data);
    return successResponse(result.message);
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    logger.error("[auth/forgot-password]", error);
    return errorResponse("Error al procesar la solicitud de restablecimiento", 500);
  }
}
