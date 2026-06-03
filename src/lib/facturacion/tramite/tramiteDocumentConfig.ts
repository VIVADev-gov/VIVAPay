import { LABELS_TIPO_DOCUMENTO } from "@/services/facturacion.service";
import { CHECKLIST_DEF } from "@/lib/facturacion/gfrFo09Checklist";
import { sanitizeFilenamePart } from "./resolveAttachmentFilename";

/** Códigos de formato configurables (sin radicado ni id de cuenta). */
export const TRAMITE_FORMAT_CODES = {
    GFR_FO_09: "GFR-FO-09",
    GDP_FO_02: "GDP-FO-02",
    GFR_FO_07: "GFR-FO-07",
    GFR_FO_16: "GFR-FO-16",
    FACTURA: "FACTURA",
} as const;

const BUNDLE_LEGAL_TIPOS = [
    "CERTIFICADO_PARAFISCALES",
    "CC_REPRESENTANTE_LEGAL",
    "TARJETA_PROFESIONAL",
    "CERTIFICADO_JUNTA_CONTADORES",
] as const;

export function nombrePorTipoDocumento(tipo: string): string {
    const label = LABELS_TIPO_DOCUMENTO[tipo];
    if (label) return sanitizeFilenamePart(label.replace(/\s+/g, "-"));
    return sanitizeFilenamePart(tipo.replace(/_/g, "-"));
}

export function nombreOpcionalItem(itemId: number): string {
    const row = CHECKLIST_DEF.find((r) => r.id === itemId);
    if (!row) return `OPCIONAL-ITEM-${itemId}`;
    const short = row.label
        .replace(/\(.*?\)/g, "")
        .trim()
        .slice(0, 40);
    return sanitizeFilenamePart(short) || `OPCIONAL-ITEM-${itemId}`;
}

export function suffixFactura(
    numeroFacturaExterno: string | null | undefined,
    posicionEnvio: number | null | undefined,
    index: number
): string | undefined {
    const ext = numeroFacturaExterno?.trim();
    if (ext) return sanitizeFilenamePart(ext);
    if (posicionEnvio != null) return String(posicionEnvio);
    if (index > 0) return String(index + 1);
    return undefined;
}

export { BUNDLE_LEGAL_TIPOS };
