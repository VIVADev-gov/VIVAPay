import { timingSafeEqual } from "crypto";
import { ORGANIZACION_TIPO } from "@/constants/organizacionViva";
import { USER_ROLES, type UserRole } from "@/constants/userRoles";
import { normalizeEmail } from "@/app/api/auth/_shared/email-domain";

export type DevSuperUserConfig = {
  email: string;
  password: string;
};

function safeComparePlainText(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isDevSuperUserEnabled() {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return process.env.DEV_SUPER_USER_ENABLED === "true";
}

export function getDevSuperUserConfig(): DevSuperUserConfig | null {
  if (!isDevSuperUserEnabled()) {
    return null;
  }

  const email = process.env.DEV_SUPER_USER_EMAIL?.trim();
  const password = process.env.DEV_SUPER_USER_PASSWORD ?? "";

  if (!email || !password) {
    return null;
  }

  return { email: normalizeEmail(email), password };
}

export function isDevSuperUserIdentifier(identifier: string) {
  const config = getDevSuperUserConfig();
  if (!config) return false;

  const normalized = identifier.trim();
  if (normalized.includes("@")) {
    return normalizeEmail(normalized) === config.email;
  }

  return false;
}

export function matchesDevSuperUserCredentials(
  identifier: string,
  password: string
) {
  const config = getDevSuperUserConfig();
  if (!config) return false;

  const normalizedIdentifier = identifier.trim();
  const emailMatches =
    normalizedIdentifier.includes("@") &&
    normalizeEmail(normalizedIdentifier) === config.email;

  if (!emailMatches) {
    return false;
  }

  return safeComparePlainText(password, config.password);
}

export function normalizeDevSuperUserRole(
  role?: string | null
): UserRole | undefined {
  const normalized = role?.trim().toUpperCase();
  if (normalized && Object.values(USER_ROLES).includes(normalized as UserRole)) {
    return normalized as UserRole;
  }
  return undefined;
}

export const DEV_SUPER_USER_DEFAULT_ORGANIZATION = {
  organizationalUnitId: "dir-planeacion",
  organizationalUnitName: "Dirección de Planeación",
  organizationalUnitType: ORGANIZACION_TIPO.DIRECCION,
  subareaId: "proc-planeacion-estrategica",
  subareaName: "Planeación Estratégica",
} as const;
