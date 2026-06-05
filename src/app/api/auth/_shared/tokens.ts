import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { UserRole } from "@/constants/userRoles";
import { JWT_EXPIRY } from "./auth.constants";

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no está definido");
  }
  return secret;
}

export function createSessionToken(payload: {
  id: string;
  email: string;
  name: string;
  status: string;
  role: UserRole;
}): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRY });
}

export function createRawVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashVerificationToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function verificationTokenExpiresAt(hours = 48): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_HOST ??
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ??
    "http://localhost:3000"
  );
}
