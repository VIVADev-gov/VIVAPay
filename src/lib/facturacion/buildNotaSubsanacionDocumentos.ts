import {
    labelDocumentoFacturacion,
    type FacturacionDetalle,
} from "@/services/facturacion.service";

export interface DocSubsanacionItem {
    key: string;
    etiqueta: string;
    url: string;
    activo: boolean;
    comentario: string;
}

/** Persistido en cuenta_cobro.subsanacion_documentos al enviar a subsanar. */
export interface SubsanacionDocumentoPersistido {
    key: string;
    etiqueta: string;
    comentario: string;
    tipo_documento: string;
    id_envio: number;
    ruta_archivo_original: string;
    /** Marcado true cuando el proveedor sube un reemplazo (la ruta en disco puede no cambiar). */
    reemplazado?: boolean;
}

/** Item enriquecido para detalle proveedor. */
export interface SubsanacionDocumentoDetalle extends SubsanacionDocumentoPersistido {
    url: string;
    reemplazado: boolean;
}

export interface SubsanacionItemInput {
    key: string;
    comentario?: string;
}

/** Clave estable alineada con buildDocumentosSubsanables (índice en lista ordenada de facturación). */
export function documentoSubsanacionKey(tipo_documento: string, index: number): string {
    return `fac:${tipo_documento}:${index}`;
}

/** Lista unificada desde documentación de facturación (incluye bundle legal + facturas por envío). */
export function buildDocumentosSubsanables(detalle: FacturacionDetalle): DocSubsanacionItem[] {
    return detalle.documentos.map((d, index) => ({
        key: documentoSubsanacionKey(d.tipo_documento, index),
        etiqueta: d.etiqueta ?? labelDocumentoFacturacion(d.tipo_documento),
        url: d.url,
        activo: false,
        comentario: "",
    }));
}

/** Conserva switches y comentarios al refrescar el detalle si la clave sigue existiendo. */
export function mergeDocSubsanacionItems(
    fresh: DocSubsanacionItem[],
    previous: DocSubsanacionItem[]
): DocSubsanacionItem[] {
    const prevByKey = new Map(previous.map((i) => [i.key, i]));
    return fresh.map((item) => {
        const prev = prevByKey.get(item.key);
        if (!prev) return item;
        return { ...item, activo: prev.activo, comentario: prev.comentario };
    });
}

export function buildNotaSubsanacionTexto(items: DocSubsanacionItem[]): string {
    const activos = items.filter((i) => i.activo);
    if (activos.length === 0) return "";

    const lineas = activos.map((i) => {
        const comentario = i.comentario.trim();
        return comentario ? `• ${i.etiqueta}: ${comentario}` : `• ${i.etiqueta}`;
    });

    return ["Se solicita subsanar los siguientes documentos:", "", ...lineas].join("\n");
}

export function isSubsanacionDocumentoReemplazado(
    item: SubsanacionDocumentoPersistido,
    rutaActual: string | null | undefined
): boolean {
    if (item.reemplazado === true) return true;
    if (!rutaActual?.trim()) return false;
    const norm = (r: string) => (r.startsWith("/") ? r : `/${r}`);
    return norm(rutaActual) !== norm(item.ruta_archivo_original);
}

export function tieneDocumentosSubsanacionActivos(items: DocSubsanacionItem[]): boolean {
    return items.some((i) => i.activo);
}
