import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/httpHerlper";
import logger from "@/lib/logger";
import { validateRequest } from "@/lib/validation";
import { AuthServiceError } from "../_shared/auth.errors";
import { loginBodySchema } from "./dto/login.dto";
import { loginService } from "./login.service";

export async function POST(request: NextRequest) {
  try {
    const validated = await validateRequest(request, loginBodySchema);
    if (!validated.success) return validated.error;

    const { token, user } = await loginService.signIn(validated.data);
    return successResponse("Inicio de sesión exitoso", { token, user });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    logger.error("[auth/login]", error);
    return errorResponse("Error al iniciar sesión", 500);
  }
}
