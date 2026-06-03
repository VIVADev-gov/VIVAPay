/**
 * Helpers de autenticación para rutas API (Node).
 * Verifica el token JWT del header Authorization: Bearer <token>.
 */
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import logger from "@/lib/logger";
import { getVivaArea, VIVA_AREA_FINANCIERA } from "@/app/viva/constants/roles";
import { isJefeNegocios, MSG_SOLO_JEFE_NEGOCIOS } from "@/lib/viva/jefeNegocios";

const SECRET_KEY = process.env.JWT_SECRET;

export interface DecodedUser {
    id: number;
    correo: string;
    rol: string;
    /** Área del funcionario (JWT login): negocios | financiera | super */
    area?: string;
    id_proveedor?: number;
    id_contratista?: number;
    [key: string]: unknown;
}

/**
 * Obtiene el token del header Authorization (Bearer) y lo verifica.
 * Devuelve el payload decodificado o null si no hay token o es inválido.
 * Normaliza "email" del token a "correo" para compatibilidad.
 */
export function getAuthFromRequest(request: NextRequest): DecodedUser | null {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        const token = authHeader.split(" ")[1]?.trim();
        if (!token) return null;

        const SECRET = process.env.JWT_SECRET;
        if (!SECRET) {
            logger.warn("[auth] JWT_SECRET no está definido");
            return null;
        }
        const decoded = jwt.verify(token, SECRET) as Record<string, unknown>;
        if (!decoded || typeof decoded !== "object") return null;

        const user: DecodedUser = {
            id: decoded.id as number,
            correo: (decoded.correo ?? decoded.email) as string,
            rol: decoded.rol as string,
            ...(typeof decoded.area === "string" && decoded.area && { area: decoded.area }),
            ...(decoded.id_proveedor != null && { id_proveedor: decoded.id_proveedor as number }),
            ...(decoded.id_contratista != null && { id_contratista: decoded.id_contratista as number }),
        };
        return user;
    } catch (err) {
        if (process.env.NODE_ENV === "development") {
            logger.warn("[auth] Token inválido o expirado:", err instanceof Error ? err.message : err);
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
            JSON.stringify({ success: false, message: "No autorizado, token inválido o faltante" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
        );
    }
    return user;
}

/** Rol de solo lectura: puede ver /viva pero no crear, editar ni eliminar. */
export const READ_ONLY_ROL = "LECTOR_VIVA";

/** Interventor: acceso al portal del contratista solo para consulta. */
export const LECTOR_CONTRATISTA_ROL = "LECTOR_CONTRATISTA";
/** Interventor: acceso al portal del proveedor solo para consulta. */
export const LECTOR_PROVEEDOR_ROL = "LECTOR_PROVEEDOR";

export function isLectorContratista(user: { rol?: string } | null): boolean {
    return user?.rol === LECTOR_CONTRATISTA_ROL;
}

export function isContratistaPortalRol(user: { rol?: string } | null): boolean {
    return user?.rol === "CONTRATISTA" || user?.rol === LECTOR_CONTRATISTA_ROL;
}

export function isProveedorPortalRol(user: { rol?: string } | null): boolean {
    return user?.rol === "PROVEEDOR" || user?.rol === LECTOR_PROVEEDOR_ROL;
}

/**
 * Rechaza la request con 403 si el usuario tiene rol de solo lectura (LECTOR_VIVA o interventor).
 * Debe usarse en todos los handlers de escritura (POST, PUT, PATCH, DELETE).
 * Retorna la NextResponse 403 a devolver, o null si el usuario puede escribir.
 */
export function requireWritePermission(request: NextRequest): NextResponse | null {
    const user = getAuthFromRequest(request);
    if (
        user?.rol === READ_ONLY_ROL ||
        user?.rol === LECTOR_CONTRATISTA_ROL ||
        user?.rol === LECTOR_PROVEEDOR_ROL
    ) {
        return NextResponse.json(
            {
                success: false,
                message: "Su rol es solo de lectura. No puede crear, editar ni eliminar.",
            },
            { status: 403 }
        );
    }
    return null;
}

/**
 * Puede listar/leer catálogos (rubros): negocios/super/lector Viva, o proveedor (para asociar materiales).
 */
export function canReadCatalogos(user: DecodedUser): boolean {
    if (
        user.rol === "PROVEEDOR" ||
        user.rol === LECTOR_PROVEEDOR_ROL ||
        user.rol === "CONTRATISTA" ||
        user.rol === LECTOR_CONTRATISTA_ROL
    ) return true;
    const area = getVivaArea({
        rol: user.rol,
        correo: user.correo,
        area: user.area,
    });
    if (area === null || area === VIVA_AREA_FINANCIERA) return false;
    return true;
}

export function requireCatalogoReadAccess(request: NextRequest): NextResponse | null {
    const user = getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json(
            { success: false, message: "No autorizado, token inválido o faltante" },
            { status: 401 }
        );
    }
    if (!canReadCatalogos(user)) {
        return NextResponse.json(
            {
                success: false,
                message: "No tiene permiso para consultar los catálogos de materiales.",
            },
            { status: 403 }
        );
    }
    return null;
}

/**
 * Catálogos (rubros): solo área negocios y super (incluye LECTOR_VIVA como super para lectura).
 * El área financiera no accede. Para GET de listado use requireCatalogoReadAccess (incluye proveedor).
 */
export function requireCatalogoNegociosAccess(request: NextRequest): NextResponse | null {
    const user = getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json(
            { success: false, message: "No autorizado, token inválido o faltante" },
            { status: 401 }
        );
    }
    const area = getVivaArea({
        rol: user.rol,
        correo: user.correo,
        area: user.area,
    });
    if (area === null || area === VIVA_AREA_FINANCIERA) {
        return NextResponse.json(
            {
                success: false,
                message: "Solo el área de negocios puede acceder a los catálogos de materiales.",
            },
            { status: 403 }
        );
    }
    return null;
}

/** Escritura en catálogos: negocios/super + no lector. */
export function requireCatalogoNegociosWrite(request: NextRequest): NextResponse | null {
    const writeBlock = requireWritePermission(request);
    if (writeBlock) return writeBlock;
    return requireCatalogoNegociosAccess(request);
}

/** Acciones reservadas al jefe de negocios (correo en VIVA_JEFE_NEGOCIOS_EMAIL). */
export function requireJefeNegocios(request: NextRequest): NextResponse | null {
    const user = getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json(
            { success: false, message: "No autorizado, token inválido o faltante" },
            { status: 401 }
        );
    }
    if (!isJefeNegocios(user)) {
        return NextResponse.json(
            { success: false, message: MSG_SOLO_JEFE_NEGOCIOS },
            { status: 403 }
        );
    }
    return null;
}
