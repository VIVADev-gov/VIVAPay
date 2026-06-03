import { NextResponse } from "next/server";

/**
 * Configuración de CORS para permitir peticiones desde diferentes orígenes
 */
export const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // En producción, especifica dominios permitidos
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    "Access-Control-Allow-Credentials": "true",
    "Content-Type": "application/json; charset=utf-8",
};

/**
 * Maneja las peticiones OPTIONS (preflight)
 */
export function handleCorsPreflightRequest() {
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders,
    });
}

/**
 * Agrega headers CORS a una respuesta existente
 */
export function addCorsHeaders(response: NextResponse) {
    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    return response;
}
