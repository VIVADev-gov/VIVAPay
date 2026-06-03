// fileUpload.ts - Utilidad para guardar archivos subidos en el servidor
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import logger from "./logger";
import { STORAGE_UPLOADS_DIR, resolveReadableUploadAbsolutePath, resolveWritableStorageUploadPath } from "./uploadsStorage";

const UPLOAD_DIR = path.join(STORAGE_UPLOADS_DIR, "rp");
const FACTURACION_DIR = path.join(STORAGE_UPLOADS_DIR, "facturacion");

/** Prefijo de ruta guardada en BD (servido por /api/uploads/[[...path]]) */
export const DB_URL_PREFIX = "/api/uploads";

const ALLOWED_EXTENSIONS = [".pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface SaveFileResult {
    success: boolean;
    filePath?: string;
    error?: string;
}

export function cuentaCobroUploadDirAbs(id_cuenta_cobro: number): string {
    return path.join(FACTURACION_DIR, `cuenta-cobro-${id_cuenta_cobro}`);
}

/** Nombre de archivo fijo en disco (sobrescritura al reemplazar). */
export function cuentaCobroDocumentFileName(tipoDocumento: string, id_envio = 0): string {
    const safeTipo = tipoDocumento.replace(/[^a-zA-Z0-9_]/g, "_");
    if (tipoDocumento === "FACTURA" && id_envio > 0) {
        return `FACTURA-envio-${id_envio}.pdf`;
    }
    return `${safeTipo}.pdf`;
}

/** Ruta relativa para BD: /api/uploads/facturacion/cuenta-cobro-{id}/TIPO.pdf */
export function cuentaCobroDocumentRelativePath(
    id_cuenta_cobro: number,
    tipoDocumento: string,
    id_envio = 0
): string {
    const fileName = cuentaCobroDocumentFileName(tipoDocumento, id_envio);
    return `${DB_URL_PREFIX}/facturacion/cuenta-cobro-${id_cuenta_cobro}/${fileName}`;
}

/**
 * Guarda (o sobrescribe) un PDF en facturacion/cuenta-cobro-{id}/.
 * Documentos legales: id_envio = 0. Facturas Viva: tipo FACTURA + id_envio. Opcionales FO-09: tipo `opcional-{itemId}`.
 */
export async function saveCuentaCobroDocumento(
    file: File,
    id_cuenta_cobro: number,
    tipoDocumento: string,
    id_envio = 0
): Promise<SaveFileResult> {
    try {
        const validationError = validateFile(file);
        if (validationError) {
            return { success: false, error: validationError };
        }

        const fileName = cuentaCobroDocumentFileName(tipoDocumento, id_envio);
        const relUnderUploads = `facturacion/cuenta-cobro-${id_cuenta_cobro}/${fileName}`;
        const absolutePath = resolveWritableStorageUploadPath(relUnderUploads);
        if (!absolutePath) {
            return { success: false, error: "Ruta de destino inválida" };
        }

        await fs.mkdir(path.dirname(absolutePath), { recursive: true });
        const arrayBuffer = await file.arrayBuffer();
        await fs.writeFile(absolutePath, Buffer.from(arrayBuffer));

        const relativePath = cuentaCobroDocumentRelativePath(id_cuenta_cobro, tipoDocumento, id_envio);
        logger.info(`[FileUpload] Documento cuenta de cobro guardado: ${relativePath}`);
        return { success: true, filePath: relativePath };
    } catch (error) {
        logger.error("[FileUpload] Error al guardar documento cuenta de cobro:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Error al guardar el archivo",
        };
    }
}

/** Factura de envío antes de tener cuenta de cobro (flujo envio-factura proveedor). */
export async function saveEnvioFacturaPreCuenta(file: File, id_envio: number): Promise<SaveFileResult> {
    try {
        const validationError = validateFile(file);
        if (validationError) {
            return { success: false, error: validationError };
        }
        const relUnderUploads = `facturacion/envio-pre-${id_envio}/FACTURA.pdf`;
        const absolutePath = resolveWritableStorageUploadPath(relUnderUploads);
        if (!absolutePath) {
            return { success: false, error: "Ruta de destino inválida" };
        }
        await fs.mkdir(path.dirname(absolutePath), { recursive: true });
        const arrayBuffer = await file.arrayBuffer();
        await fs.writeFile(absolutePath, Buffer.from(arrayBuffer));
        const relativePath = `${DB_URL_PREFIX}/${relUnderUploads}`;
        logger.info(`[FileUpload] Factura pre-cuenta guardada: ${relativePath}`);
        return { success: true, filePath: relativePath };
    } catch (error) {
        logger.error("[FileUpload] Error al guardar factura pre-cuenta:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Error al guardar el archivo",
        };
    }
}

export const initUploadDir = async (): Promise<void> => {
    try {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        logger.debug(`[FileUpload] Directorio de uploads inicializado: ${UPLOAD_DIR}`);
    } catch (error) {
        logger.error("[FileUpload] Error al crear directorio de uploads:", error);
        throw new Error("No se pudo inicializar el directorio de uploads");
    }
};

export const validateFile = (file: File): string | null => {
    if (!file) {
        return "No se proporcionó ningún archivo";
    }
    if (file.size > MAX_FILE_SIZE) {
        return `El archivo excede el tamaño máximo permitido de ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    if (file.type !== "application/pdf") {
        return "El archivo debe ser un PDF (application/pdf)";
    }
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return `Extensión de archivo no permitida. Solo se permiten: ${ALLOWED_EXTENSIONS.join(", ")}`;
    }
    return null;
};

const generateUniqueFileName = (originalName: string, rpId?: number): string => {
    const timestamp = Date.now();
    const uuid = randomUUID();
    const ext = path.extname(originalName);
    if (rpId) {
        return `rp-${rpId}-${timestamp}-${uuid}${ext}`;
    }
    return `rp-${timestamp}-${uuid}${ext}`;
};

export const saveFile = async (file: File, rpId?: number): Promise<SaveFileResult> => {
    try {
        const validationError = validateFile(file);
        if (validationError) {
            logger.warn(`[FileUpload] Validación fallida: ${validationError}`);
            return { success: false, error: validationError };
        }
        await initUploadDir();
        const uniqueName = generateUniqueFileName(file.name, rpId);
        const filePath = path.join(UPLOAD_DIR, uniqueName);
        const arrayBuffer = await file.arrayBuffer();
        await fs.writeFile(filePath, Buffer.from(arrayBuffer));
        const relativePath = `${DB_URL_PREFIX}/rp/${uniqueName}`;
        logger.info(`[FileUpload] Archivo guardado exitosamente: ${relativePath}`);
        return { success: true, filePath: relativePath };
    } catch (error) {
        logger.error("[FileUpload] Error al guardar archivo:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Error al guardar el archivo",
        };
    }
};

export const deleteFile = async (filePath: string): Promise<boolean> => {
    try {
        const absolutePath = await resolveReadableUploadAbsolutePath(filePath);
        if (!absolutePath) {
            logger.warn(`[FileUpload] No se encontró archivo para eliminar: ${filePath}`);
            return false;
        }
        await fs.unlink(absolutePath);
        logger.info(`[FileUpload] Archivo eliminado: ${filePath}`);
        return true;
    } catch (error) {
        logger.error(`[FileUpload] Error al eliminar archivo ${filePath}:`, error);
        return false;
    }
};

/** Purga carpetas facturacion/cuenta-cobro-* sin modificar en más de N días. */
export const purgeFacturacionCuentaCobroFoldersOlderThanDays = async (
    olderThanDays: number
): Promise<{ deletedPaths: string[] }> => {
    const deletedPaths: string[] = [];
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    try {
        await fs.mkdir(FACTURACION_DIR, { recursive: true });
        const entries = await fs.readdir(FACTURACION_DIR, { withFileTypes: true });
        for (const ent of entries) {
            if (!ent.isDirectory() || !ent.name.startsWith("cuenta-cobro-")) continue;
            const dirAbs = path.join(FACTURACION_DIR, ent.name);
            const stat = await fs.stat(dirAbs);
            if (stat.mtimeMs >= cutoff) continue;
            const files = await fs.readdir(dirAbs);
            for (const f of files) {
                const fileAbs = path.join(dirAbs, f);
                const rel = `${DB_URL_PREFIX}/facturacion/${ent.name}/${f}`;
                await fs.unlink(fileAbs).catch(() => {});
                deletedPaths.push(rel);
            }
            await fs.rmdir(dirAbs).catch(() => {});
            logger.info(`[FileUpload] Purga carpeta facturación: ${ent.name}`);
        }
    } catch (error) {
        logger.error("[FileUpload] Error en purga facturación:", error);
    }
    return { deletedPaths };
};

export const getFileInfo = async (
    filePath: string
): Promise<{ size: number; createdAt: Date } | null> => {
    try {
        const absolutePath = await resolveReadableUploadAbsolutePath(filePath);
        if (!absolutePath) return null;
        const stats = await fs.stat(absolutePath);
        return { size: stats.size, createdAt: stats.birthtime };
    } catch (error) {
        logger.error(`[FileUpload] Error al obtener info de archivo ${filePath}:`, error);
        return null;
    }
};
