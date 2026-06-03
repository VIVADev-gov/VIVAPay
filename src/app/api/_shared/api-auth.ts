import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { User, toPublicUser } from "@/models/user";
import { getJwtSecret } from "../auth/_shared/tokens";

export const API_AUTH_ERROR_CODES = {
  MISSING_TOKEN: "MISSING_TOKEN",
  INVALID_TOKEN: "INVALID_TOKEN",
  USER_NOT_FOUND: "USER_NOT_FOUND",
} as const;

export type ApiAuthErrorCode =
  (typeof API_AUTH_ERROR_CODES)[keyof typeof API_AUTH_ERROR_CODES];

export class ApiAuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 401,
    public readonly code: ApiAuthErrorCode = API_AUTH_ERROR_CODES.INVALID_TOKEN
  ) {
    super(message);
  }
}

type SessionPayload = {
  id: string;
  email: string;
  name: string;
  status: string;
};

export async function requireApiAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;

  if (!token) {
    throw new ApiAuthError(
      "No se encontró token de autenticación",
      401,
      API_AUTH_ERROR_CODES.MISSING_TOKEN
    );
  }

  let payload: SessionPayload;
  try {
    payload = jwt.verify(token, getJwtSecret()) as SessionPayload;
  } catch {
    throw new ApiAuthError(
      "Token de autenticación inválido",
      401,
      API_AUTH_ERROR_CODES.INVALID_TOKEN
    );
  }

  await connectDB();
  const user = await User.findById(payload.id);

  if (!user) {
    throw new ApiAuthError(
      "Usuario autenticado no encontrado",
      401,
      API_AUTH_ERROR_CODES.USER_NOT_FOUND
    );
  }

  return {
    user,
    publicUser: toPublicUser(user),
  };
}
