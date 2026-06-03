import "server-only";

import {
    collectDiskSources,
    diskFilenameParts,
    readDiskPdfBuffer,
} from "./diskPdfCollector";
import { generateGdp02Pdf } from "./gdp02PdfGenerator";
import { generateHtmlFormPdf } from "./htmlFormPdfGenerator";
import { buildTramiteContext } from "./buildTramiteContext";
import { dedupeFilenames } from "./resolveAttachmentFilename";
import { TRAMITE_FORMAT_CODES } from "./tramiteDocumentConfig";
import type {
    TramiteAttachment,
    TramiteBuildContext,
    TramiteBuildResult,
} from "./types";
import type { FacturacionVivaDetallePayload } from "@/app/api/viva/facturacion/facturacion-cuenta.service";

const MAX_TOTAL_BYTES = 20 * 1024 * 1024;

function formularioCompleto(data: Record<string, unknown> | null | undefined): boolean {
    return !!data && data.completo === true;
}

function validateFormularios(ctx: TramiteBuildContext): string | null {
    for (const item of ctx.itemsIncluidos) {
        if (item.kind === "viva_gdp02" && !formularioCompleto(ctx.detalle.cuenta.formulario_gdp02)) {
            return "El formulario GDP-FO-02 debe estar guardado y marcado como completado";
        }
        if (item.kind === "viva_gfr07" && !formularioCompleto(ctx.detalle.cuenta.formulario_fo07)) {
            return "El formulario GFR-FO-07 debe estar guardado y marcado como completado";
        }
        if (item.kind === "viva_gfr16" && !formularioCompleto(ctx.detalle.cuenta.formulario_fo16)) {
            return "El formulario GFR-FO-16 debe estar guardado y marcado como completado";
        }
    }
    return null;
}

function includesKind(ctx: TramiteBuildContext, kind: string): boolean {
    return ctx.itemsIncluidos.some((i) => i.kind === kind);
}

export async function buildTramitePackage(
    idCuenta: number,
    payload: FacturacionVivaDetallePayload
): Promise<TramiteBuildResult> {
    if (payload.gfr_fo09_checklist_completo !== true) {
        return { success: false, error: "El checklist GFR-FO-09 obligatorio no está completo" };
    }

    const ctx = buildTramiteContext(idCuenta, payload);
    const formError = validateFormularios(ctx);
    if (formError) {
        return { success: false, error: formError };
    }

    const nameEntries: Array<{ docKey: string; baseName: string; suffix?: string }> = [];

    nameEntries.push({ docKey: "html:GFR-FO-09", baseName: TRAMITE_FORMAT_CODES.GFR_FO_09 });

    if (includesKind(ctx, "viva_gdp02")) {
        nameEntries.push({ docKey: "gdp02:GDP-FO-02", baseName: TRAMITE_FORMAT_CODES.GDP_FO_02 });
    }
    if (includesKind(ctx, "viva_gfr07")) {
        nameEntries.push({ docKey: "html:GFR-FO-07", baseName: TRAMITE_FORMAT_CODES.GFR_FO_07 });
    }
    if (includesKind(ctx, "viva_gfr16")) {
        nameEntries.push({ docKey: "html:GFR-FO-16", baseName: TRAMITE_FORMAT_CODES.GFR_FO_16 });
    }

    const diskSources = collectDiskSources(ctx);
    let facturaIndex = 0;
    for (const source of diskSources) {
        const parts =
            source.tipoDocumento === "FACTURA"
                ? diskFilenameParts(source, facturaIndex++)
                : diskFilenameParts(source, 0);
        nameEntries.push({ docKey: source.docKey, ...parts });
    }

    const filenames = dedupeFilenames(nameEntries);
    const buffers = new Map<string, Buffer>();

    try {
        buffers.set("html:GFR-FO-09", await generateHtmlFormPdf(ctx, "gfr-fo-09"));

        if (includesKind(ctx, "viva_gdp02")) {
            buffers.set("gdp02:GDP-FO-02", await generateGdp02Pdf(ctx));
        }
        if (includesKind(ctx, "viva_gfr07")) {
            buffers.set("html:GFR-FO-07", await generateHtmlFormPdf(ctx, "gfr-fo-07"));
        }
        if (includesKind(ctx, "viva_gfr16")) {
            buffers.set("html:GFR-FO-16", await generateHtmlFormPdf(ctx, "gfr-fo-16"));
        }

        for (const source of diskSources) {
            buffers.set(source.docKey, await readDiskPdfBuffer(source));
        }
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Error al generar documentos del trámite";
        return { success: false, error: msg };
    }

    const attachments: TramiteAttachment[] = [];
    let totalBytes = 0;

    for (const entry of nameEntries) {
        const buffer = buffers.get(entry.docKey);
        const filename = filenames.get(entry.docKey);
        if (!buffer || !filename) {
            return { success: false, error: `No se generó el adjunto: ${entry.docKey}` };
        }
        totalBytes += buffer.length;
        attachments.push({
            docKey: entry.docKey,
            filename,
            buffer,
            contentType: "application/pdf",
        });
    }

    if (totalBytes > MAX_TOTAL_BYTES) {
        const mb = (totalBytes / (1024 * 1024)).toFixed(1);
        return {
            success: false,
            error: `El tamaño total de adjuntos (${mb} MB) supera el límite de 20 MB`,
        };
    }

    return { success: true, attachments };
}
