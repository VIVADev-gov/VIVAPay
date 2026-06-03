import type { FacturacionVivaDetallePayload } from "@/app/api/viva/facturacion/facturacion-cuenta.service";
import type { ChecklistRowDef } from "@/lib/facturacion/gfrFo09Checklist";

export type TramiteGeneratorKind = "disk" | "gdp02" | "html";

export type TramiteHtmlTemplate = "gfr-fo-09" | "gfr-fo-07" | "gfr-fo-16";

export interface TramiteAttachment {
    docKey: string;
    filename: string;
    buffer: Buffer;
    contentType: "application/pdf";
}

export interface TramiteBuildContext {
    idCuenta: number;
    detalle: FacturacionVivaDetallePayload;
    itemsIncluidos: ChecklistRowDef[];
    incluirListaVerificacion: boolean;
}

export interface TramiteDiskSource {
    docKey: string;
    ruta: string;
    tipoDocumento: string;
    idEnvio?: number;
    numeroFacturaExterno?: string | null;
    posicionEnvio?: number | null;
    checklistItemId?: number;
}

export interface TramiteBuildResult {
    success: boolean;
    attachments?: TramiteAttachment[];
    error?: string;
}

export interface TramiteSendResult {
    success: boolean;
    messageId?: string;
    attachmentCount?: number;
    error?: string;
}
