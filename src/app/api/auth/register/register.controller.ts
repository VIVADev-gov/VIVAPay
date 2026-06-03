import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/httpHerlper";
import logger from "@/lib/logger";
import { validateRequest } from "@/lib/validation";
import { AuthServiceError } from "../_shared/auth.errors";
import { registerBodySchema } from "./dto/register.dto";
import { registerService } from "./register.service";

export async function POST(request: NextRequest) {
  try {
    const validated = await validateRequest(request, registerBodySchema);
    if (!validated.success) return validated.error;

    const result = await registerService.create(validated.data);
    return successResponse(result.message, { email: result.email }, 201);
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    logger.error("[auth/register]", error);
    return errorResponse("Error al registrar el usuario", 500);
  }
}
