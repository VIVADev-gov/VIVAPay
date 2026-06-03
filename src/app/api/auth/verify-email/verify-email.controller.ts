import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/httpHerlper";
import logger from "@/lib/logger";
import { validateQuery } from "@/lib/validation";
import { AuthServiceError } from "../_shared/auth.errors";
import { verifyEmailQuerySchema } from "./dto/verify-email.dto";
import { verifyEmailService } from "./verify-email.service";

export async function GET(request: NextRequest) {
  try {
    const validated = validateQuery(request, verifyEmailQuerySchema);
    if (!validated.success) return validated.error;

    const result = await verifyEmailService.confirm(validated.data.token);
    return successResponse(result.message, {
      alreadyVerified: result.alreadyVerified,
    });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    logger.error("[auth/verify-email]", error);
    return errorResponse("Error al verificar el correo", 500);
  }
}
