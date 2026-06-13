/**
 * Helpers de autenticación para rutas API (Node).
 * Verifica el token JWT del header Authorization: Bearer <token>.
 */
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import logger from "@/lib/logger";

export interface DecodedUser {
  id: number;
  correo: string;
  rol: string;
  area?: string;
  id_proveedor?: number;
  id_contratista?: number;
  [key: string]: unknown;
}

/**
 * Obtiene el token del header Authorization (Bearer) y lo verifica.
 * Devuelve el payload decodificado o null si no hay token o es inválido.
 */
export function getAuthFromRequest(request: NextRequest): DecodedUser | null {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.split(" ")[1]?.trim();
    if (!token) return null;

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      logger.warn("[auth] JWT_SECRET no está definido");
      return null;
    }

    const decoded = jwt.verify(token, secret) as Record<string, unknown>;
    if (!decoded || typeof decoded !== "object") return null;

    return {
      id: decoded.id as number,
      correo: (decoded.correo ?? decoded.email) as string,
      rol: decoded.rol as string,
      ...(typeof decoded.area === "string" && decoded.area && { area: decoded.area }),
      ...(decoded.id_proveedor != null && {
        id_proveedor: decoded.id_proveedor as number,
      }),
      ...(decoded.id_contratista != null && {
        id_contratista: decoded.id_contratista as number,
      }),
    };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      logger.warn(
        "[auth] Token inválido o expirado:",
        err instanceof Error ? err.message : err
      );
    }
    return null;
  }
}

/**
 * Exige autenticación en la request.
 * Si el token es válido devuelve el usuario decodificado.
 * Si no, devuelve una Response 401 para devolver al cliente.
 */
export function requireAuth(request: NextRequest): DecodedUser | Response {
  const user = getAuthFromRequest(request);
  if (!user) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "No autorizado, token inválido o faltante",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  return user;
}
