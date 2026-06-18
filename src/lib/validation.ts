import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "./httpHerlper";
import logger from "./logger";
import { formatZodErrorMessage } from "./validation/formatZodErrorMessage";

/**
 * Valida el body de una request usando un esquema Zod
 * @param request - Request de Next.js
 * @param schema - Esquema de validación Zod
 * @returns Objeto validado o null si hay error
 */
export async function validateRequest<T>(
    request: NextRequest,
    schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: NextResponse }> {
    try {
        const body = await request.json();
        const validatedData = schema.parse(body);
        return { success: true, data: validatedData };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const message = formatZodErrorMessage(error);
            logger.warn("[Validation] Error de validación:", error.issues);
            return {
                success: false,
                error: errorResponse(message, 400),
            };
        }
        logger.error("[Validation] Error inesperado:", error);
        return {
            success: false,
            error: errorResponse("Error al procesar la solicitud", 400),
        };
    }
}

/**
 * Valida los query parameters usando un esquema Zod
 * @param request - Request de Next.js
 * @param schema - Esquema de validación Zod
 * @returns Objeto validado o null si hay error
 */
export function validateQuery<T>(
    request: NextRequest,
    schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: NextResponse } {
    try {
        const { searchParams } = new URL(request.url);
        const params: Record<string, string> = {};
        searchParams.forEach((value, key) => {
            params[key] = value;
        });
        const validatedData = schema.parse(params);
        return { success: true, data: validatedData };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const message = formatZodErrorMessage(error);
            logger.warn("[Validation] Error de validación en query:", error.issues);
            return {
                success: false,
                error: errorResponse(message, 400),
            };
        }
        logger.error("[Validation] Error inesperado:", error);
        return {
            success: false,
            error: errorResponse("Error al procesar los parámetros", 400),
        };
    }
}
