import { connectDB } from "@/lib/db/mongoose";
import { User, toPublicUser } from "@/models/user";
import { AUTH_ERROR_CODES, AuthServiceError } from "../_shared/auth.errors";
import { USER_STATUS } from "../_shared/auth.constants";
import { isVivaGovEmail, normalizeEmail } from "../_shared/email-domain";
import { comparePassword } from "../_shared/password";
import { createSessionToken } from "../_shared/tokens";
import type { LoginBodyDto } from "./dto/login.dto";

export const loginService = {
  async signIn(dto: LoginBodyDto) {
    await connectDB();

    const identifier = dto.identifier.trim();
    const isEmail = identifier.includes("@");

    if (isEmail && !isVivaGovEmail(identifier)) {
      throw new AuthServiceError("El correo debe ser del dominio @viva.gov.co", 400);
    }

    const user = await User.findOne(
      isEmail ? { email: normalizeEmail(identifier) } : { documentId: identifier }
    );

    if (!user) {
      throw new AuthServiceError(
        "No existe una cuenta con este correo o documento. Debe registrarse primero.",
        404,
        AUTH_ERROR_CODES.USER_NOT_FOUND
      );
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      throw new AuthServiceError(
        "Su cuenta no tiene acceso activo. Contacte al administrador.",
        403,
        AUTH_ERROR_CODES.ACCOUNT_INACTIVE
      );
    }

    if (!user.emailVerified) {
      throw new AuthServiceError(
        "Debe confirmar su correo antes de iniciar sesión. Revise su bandeja de entrada.",
        403,
        AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED
      );
    }

    const valid = await comparePassword(dto.password, user.passwordHash);
    if (!valid) {
      throw new AuthServiceError(
        "Contraseña incorrecta. Verifique sus datos e intente de nuevo.",
        401,
        AUTH_ERROR_CODES.INVALID_PASSWORD
      );
    }

    const publicUser = toPublicUser(user);
    const token = createSessionToken({
      id: publicUser.id,
      email: publicUser.email,
      name: publicUser.name,
      status: publicUser.status,
      role: publicUser.role,
    });

    return { token, user: publicUser };
  },
};
