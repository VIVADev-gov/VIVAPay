/**
 * Uploads en `storage/uploads/` (servidos por GET /api/uploads/[[...path]]).
 * Rutas en BD: `/api/uploads/...`
 */
import fs from "fs/promises";
import path from "path";

export const STORAGE_UPLOADS_DIR = path.join(process.cwd(), "storage", "uploads");

const API_PREFIX = "/api/uploads/";

export function isPathInsideDirectory(filePath: string, dir: string): boolean {
    const resolvedFile = path.resolve(filePath);
    const resolvedDir = path.resolve(dir);
    return resolvedFile === resolvedDir || resolvedFile.startsWith(resolvedDir + path.sep);
}

/**
 * Ruta relativa dentro de storage/uploads (sin barra inicial), o null si inválida.
 */
export function parseUploadRelativePath(dbPath: string): string | null {
    const trimmed = dbPath.trim();
    if (!trimmed) return null;
    let rel: string;
    if (trimmed.startsWith(API_PREFIX)) {
        rel = trimmed.slice(API_PREFIX.length);
    } else if (trimmed.toLowerCase().startsWith("uploads/")) {
        rel = trimmed.slice("uploads/".length);
    } else {
        return null;
    }
    if (!rel || rel.includes("..")) return null;
    return rel;
}

/**
 * Ruta absoluta en disco para leer un upload.
 */
export async function resolveReadableUploadAbsolutePath(dbPath: string): Promise<string | null> {
    const rel = parseUploadRelativePath(dbPath);
    if (!rel) return null;

    const abs = path.resolve(path.join(STORAGE_UPLOADS_DIR, rel));
    if (!isPathInsideDirectory(abs, STORAGE_UPLOADS_DIR)) return null;
    try {
        await fs.access(abs);
        return abs;
    } catch {
        return null;
    }
}

/**
 * Ruta absoluta para escribir bajo storage/uploads.
 */
export function resolveWritableStorageUploadPath(relativeUnderUploads: string): string | null {
    if (!relativeUnderUploads || relativeUnderUploads.includes("..")) return null;
    const abs = path.resolve(path.join(STORAGE_UPLOADS_DIR, relativeUnderUploads));
    if (!isPathInsideDirectory(abs, STORAGE_UPLOADS_DIR)) return null;
    return abs;
}
