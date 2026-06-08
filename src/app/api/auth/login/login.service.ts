import { formatOrganizacionDisplay } from "@/constants/organizacionViva";
import { USER_ROLES } from "@/constants/userRoles";
import {
  DEV_SUPER_USER_DEFAULT_ORGANIZATION,
  getDevSuperUserConfig,
  matchesDevSuperUserCredentials,
  normalizeDevSuperUserRole,
} from "@/lib/auth/devSuperUser";
import { connectDB } from "@/lib/db/mongoose";
import logger from "@/lib/logger";
import { User, toPublicUser } from "@/models/user";
import { AUTH_ERROR_CODES, AuthServiceError } from "../_shared/auth.errors";
import { USER_STATUS } from "../_shared/auth.constants";
import { isVivaGovEmail, normalizeEmail } from "../_shared/email-domain";
import { comparePassword, hashPassword } from "../_shared/password";
import { createSessionToken } from "../_shared/tokens";
import type { LoginBodyDto } from "./dto/login.dto";

async function ensureDevSuperUserRecord(email: string, password: string) {
  let user = await User.findOne({ email }).exec();

  if (!user) {
    const passwordHash = await hashPassword(password);
    const areaDisplay = formatOrganizacionDisplay({
      organizationalUnitName:
        DEV_SUPER_USER_DEFAULT_ORGANIZATION.organizationalUnitName,
      organizationalUnitType:
        DEV_SUPER_USER_DEFAULT_ORGANIZATION.organizationalUnitType,
      subareaName: DEV_SUPER_USER_DEFAULT_ORGANIZATION.subareaName,
    });

    user = await User.create({
      email,
      passwordHash,
      name: "Dev Super User",
      documentId: "0000000000",
      phone: "3000000000",
      role: USER_ROLES.CONTRATISTA,
      organizationalUnitId: DEV_SUPER_USER_DEFAULT_ORGANIZATION.organizationalUnitId,
      organizationalUnitName:
        DEV_SUPER_USER_DEFAULT_ORGANIZATION.organizationalUnitName,
      organizationalUnitType:
        DEV_SUPER_USER_DEFAULT_ORGANIZATION.organizationalUnitType,
      subareaId: DEV_SUPER_USER_DEFAULT_ORGANIZATION.subareaId,
      subareaName: DEV_SUPER_USER_DEFAULT_ORGANIZATION.subareaName,
      area: areaDisplay,
      emailVerified: true,
      status: USER_STATUS.ACTIVE,
      verificationTokenHash: null,
      verificationTokenExpiresAt: null,
    });

    logger.warn("[auth/login] Cuenta dev superusuario creada automáticamente", {
      email,
    });
  } else if (!user.emailVerified) {
    user.emailVerified = true;
    user.verificationTokenHash = null;
    user.verificationTokenExpiresAt = null;
    await user.save();
  }

  return user;
}

async function signInDevSuperUser(dto: LoginBodyDto) {
  const config = getDevSuperUserConfig();
  if (!config) {
    throw new AuthServiceError("Acceso dev no disponible", 403);
  }

  if (!matchesDevSuperUserCredentials(dto.identifier, dto.password)) {
    throw new AuthServiceError(
      "Credenciales dev inválidas",
      401,
      AUTH_ERROR_CODES.INVALID_PASSWORD
    );
  }

  const user = await ensureDevSuperUserRecord(config.email, config.password);
  const effectiveRole = normalizeDevSuperUserRole(dto.devRole) ?? user.role;
  const publicUser = {
    ...toPublicUser(user),
    role: effectiveRole,
    emailVerified: true,
  };

  const token = createSessionToken({
    id: publicUser.id,
    email: publicUser.email,
    name: publicUser.name,
    status: publicUser.status,
    role: effectiveRole,
    isDevSuperUser: true,
  });

  logger.warn("[auth/login] Inicio de sesión dev superusuario", {
    email: publicUser.email,
    role: effectiveRole,
  });

  return { token, user: publicUser };
}

export const loginService = {
  async signIn(dto: LoginBodyDto) {
    await connectDB();

    if (matchesDevSuperUserCredentials(dto.identifier, dto.password)) {
      return signInDevSuperUser(dto);
    }

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
