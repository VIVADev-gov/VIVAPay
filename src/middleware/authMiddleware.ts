/**
 * Middleware de autenticación para rutas API.
 * Envuelve un handler y exige token JWT válido antes de ejecutarlo.
 * Para App Router usa getAuthFromRequest o requireAuth en lib/auth.ts.
 */
import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";

type ApiHandler = (
    request: NextRequest,
    context: { params?: Promise<Record<string, string>> }
) => Promise<NextResponse> | NextResponse;

/**
 * Envuelve un handler de API y exige Authorization: Bearer <token> válido.
 * El handler recibe la request; el usuario decodificado está en request.headers (no se muta req.user en Next).
 * Para acceder al usuario en el handler, usa getAuthFromRequest(request) dentro del mismo.
 */
export function authMiddleware(handler: ApiHandler): ApiHandler {
    return async (request: NextRequest, context: { params?: Promise<Record<string, string>> }) => {
        const user = getAuthFromRequest(request);
        if (!user) {
            return NextResponse.json(
                { success: false, message: "No autorizado, token inválido o faltante" },
                { status: 401 }
            );
        }
        return handler(request, context);
    };
}
