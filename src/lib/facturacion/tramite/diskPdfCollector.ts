import "server-only";

import fs from "fs/promises";

import { getDocumentosSoporte } from "@/lib/facturacion/gfrFo09Checklist";
import { resolveReadableUploadAbsolutePath } from "@/lib/uploadsStorage";
import type { FacturacionDetalle } from "@/services/facturacion.service";
import {
    BUNDLE_LEGAL_TIPOS,
    nombreOpcionalItem,
    nombrePorTipoDocumento,
    suffixFactura,
    TRAMITE_FORMAT_CODES,
} from "./tramiteDocumentConfig";
import type { TramiteBuildContext, TramiteDiskSource } from "./types";

function asDetalle(ctx: TramiteBuildContext): FacturacionDetalle {
    const p = ctx.detalle;
    return {
        cuenta: { ...p.cuenta, estado: p.cuenta.estado },
        envios: p.envios.map((e) => ({
            ...e,
            remision: e.remision ?? undefined,
            valor_envio_cop: e.valor_envio_cop,
        })),
        documentos: p.documentos,
        documentos_proveedor_cuenta: p.documentos_proveedor_cuenta,
        gfr_fo09_checklist_completo: p.gfr_fo09_checklist_completo,
    };
}

function parseEnvioIdFromPath(ruta: string): number | undefined {
    const m = ruta.match(/FACTURA-envio-(\d+)/i);
    if (!m) return undefined;
    const id = parseInt(m[1], 10);
    return Number.isFinite(id) ? id : undefined;
}

function envioMeta(ctx: TramiteBuildContext, idEnvio: number | undefined, index: number) {
    if (idEnvio == null) return { numeroFacturaExterno: null as string | null, posicionEnvio: null as number | null };
    const ev = ctx.detalle.envios.find((e) => e.id_envio === idEnvio);
    return {
        numeroFacturaExterno: ev?.numero_factura_externo ?? null,
        posicionEnvio: ev?.posicion_envio ?? null,
    };
}

/** Recolecta fuentes en disco según ítems incluidos en el trámite. */
export function collectDiskSources(ctx: TramiteBuildContext): TramiteDiskSource[] {
    const detalle = asDetalle(ctx);
    const sources: TramiteDiskSource[] = [];
    const seenRutas = new Set<string>();

    const pushUnique = (source: TramiteDiskSource) => {
        const key = source.ruta.trim();
        if (!key || seenRutas.has(key)) return;
        seenRutas.add(key);
        sources.push(source);
    };

    for (const item of ctx.itemsIncluidos) {
        if (item.kind === "viva_gdp02" || item.kind === "viva_gfr07" || item.kind === "viva_gfr16") {
            continue;
        }

        const docs = getDocumentosSoporte(item, detalle);
        if (item.kind === "factura_facturacion") {
            docs.forEach((doc, index) => {
                const ruta = doc.ruta_archivo ?? doc.url ?? "";
                const idEnvio = parseEnvioIdFromPath(ruta);
                const meta = envioMeta(ctx, idEnvio, index);
                pushUnique({
                    docKey: `disk:FACTURA:${index}:${ruta}`,
                    ruta,
                    tipoDocumento: "FACTURA",
                    idEnvio,
                    numeroFacturaExterno: meta.numeroFacturaExterno,
                    posicionEnvio: meta.posicionEnvio,
                });
            });
            continue;
        }

        if (item.kind === "proveedor_rut") {
            docs.forEach((doc, index) => {
                const ruta = doc.ruta_archivo ?? doc.url ?? "";
                pushUnique({
                    docKey: `disk:RUT:${index}:${ruta}`,
                    ruta,
                    tipoDocumento: "RUT",
                });
            });
            continue;
        }

        if (item.kind === "bundle_legal") {
            docs.forEach((doc, index) => {
                const ruta = doc.ruta_archivo ?? doc.url ?? "";
                pushUnique({
                    docKey: `disk:${doc.tipo_documento}:${index}:${ruta}`,
                    ruta,
                    tipoDocumento: doc.tipo_documento,
                });
            });
            continue;
        }

        if (item.kind === "opcional") {
            docs.forEach((doc, index) => {
                const ruta = doc.ruta_archivo ?? doc.url ?? "";
                pushUnique({
                    docKey: `disk:OPCIONAL:${item.id}:${index}:${ruta}`,
                    ruta,
                    tipoDocumento: doc.tipo_documento,
                    checklistItemId: item.id,
                });
            });
        }
    }

    return sources;
}

export function diskFilenameParts(source: TramiteDiskSource, facturaIndex: number): {
    baseName: string;
    suffix?: string;
} {
    if (source.tipoDocumento === "FACTURA") {
        return {
            baseName: TRAMITE_FORMAT_CODES.FACTURA,
            suffix: suffixFactura(
                source.numeroFacturaExterno,
                source.posicionEnvio,
                facturaIndex
            ),
        };
    }
    if (source.tipoDocumento.startsWith("OPCIONAL_ITEM_") && source.checklistItemId != null) {
        return { baseName: nombreOpcionalItem(source.checklistItemId) };
    }
    if ((BUNDLE_LEGAL_TIPOS as readonly string[]).includes(source.tipoDocumento)) {
        return { baseName: nombrePorTipoDocumento(source.tipoDocumento) };
    }
    return { baseName: nombrePorTipoDocumento(source.tipoDocumento) };
}

export async function readDiskPdfBuffer(source: TramiteDiskSource): Promise<Buffer> {
    const abs = await resolveReadableUploadAbsolutePath(source.ruta);
    if (!abs) {
        throw new Error(`No se encontró el archivo en disco: ${source.tipoDocumento} (${source.ruta})`);
    }
    const buf = await fs.readFile(abs);
    if (buf.length === 0) {
        throw new Error(`El archivo está vacío: ${source.tipoDocumento}`);
    }
    return buf;
}
