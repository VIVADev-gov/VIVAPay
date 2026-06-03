import {
    LABELS_TIPO_DOCUMENTO,
    type FacturacionDetalle,
    type FacturacionDetalleDocumento,
} from "@/services/facturacion.service";
import { detalleConvenioMetadataCompleta } from "@/lib/facturacionConvenioPrefill";

export type ItemKind =
    | "factura_facturacion"
    | "viva_gdp02"
    | "viva_gfr07"
    | "proveedor_rut"
    | "bundle_legal"
    | "viva_gfr16"
    | "opcional";

export interface ChecklistRowDef {
    id: number;
    label: string;
    required: boolean;
    kind: ItemKind;
}

export const CHECKLIST_DEF: ChecklistRowDef[] = [
    { id: 1, label: "Factura o cuenta de cobro", required: true, kind: "factura_facturacion" },
    { id: 2, label: "GDP-FO-02 Informe de Supervisión para Pago", required: true, kind: "viva_gdp02" },
    { id: 3, label: "GFR-FO-07 Certificado de Recibido a Satisfacción", required: true, kind: "viva_gfr07" },
    { id: 4, label: "Copia de Rut debidamente actualizado", required: true, kind: "proveedor_rut" },
    { id: 5, label: "Certificación art 18 ley 1819 de 2016, personas naturales (Primer Pago)", required: false, kind: "opcional" },
    { id: 6, label: "Contrato, Modificación o Adición (Primer Pago)", required: false, kind: "opcional" },
    { id: 7, label: "GJC-FO-22 Acta de inicio (Primer Pago)", required: false, kind: "opcional" },
    { id: 8, label: "Certificación Bancaria (Primer Pago)", required: false, kind: "opcional" },
    { id: 9, label: "GBS-FO-40 Acta de Recibo Final (Pago Final)", required: false, kind: "opcional" },
    { id: 10, label: "GBS-FO-32 Acta de Liquidación Bilateral (Pago Final)", required: false, kind: "opcional" },
    { id: 11, label: "Carta Juramentada del IBC (persona natural)", required: false, kind: "opcional" },
    {
        id: 12,
        label: "Declaración juramentada del IBC aportes a seguridad social + Soportes de pago de la seguridad social de la empresa (Persona natural)",
        required: false,
        kind: "opcional",
    },
    {
        id: 13,
        label: "Certificación de pago de seguridad social y parafiscales, firmada por el representante legal o Revisor fiscal (persona jurídica) copia TP, CC y Certificado JCC.",
        required: true,
        kind: "bundle_legal",
    },
    { id: 14, label: "GFR-FO-16 Autorización pago ordenador del gasto", required: true, kind: "viva_gfr16" },
    { id: 15, label: "GBS-FO-05 Evaluación de Proveedores (Último pago)", required: false, kind: "opcional" },
];

const BUNDLE_LEGAL_TIPOS = [
    "CERTIFICADO_PARAFISCALES",
    "CC_REPRESENTANTE_LEGAL",
    "TARJETA_PROFESIONAL",
    "CERTIFICADO_JUNTA_CONTADORES",
] as const;

export type ChecklistItemVariant = "obligatorio" | "opcionalMarcado" | "opcional";

function hasFacturaCuenta(detalle: FacturacionDetalle): boolean {
    const enFacturacion = detalle.documentos.some(
        (d) => d.tipo_documento === "FACTURA" || /^FACTURA_\d+$/.test(d.tipo_documento)
    );
    const enProveedor = (detalle.documentos_proveedor_cuenta ?? []).some((d) => d.tipo_documento === "FACTURA");
    return enFacturacion || enProveedor;
}

function proveedorTieneRut(detalle: FacturacionDetalle): boolean {
    const enProveedor = (detalle.documentos_proveedor_cuenta ?? []).some((d) => d.tipo_documento === "RUT");
    const enFacturacion = detalle.documentos.some((d) => d.tipo_documento === "RUT");
    return enProveedor || enFacturacion;
}

function proveedorCumpleBundleLegal(detalle: FacturacionDetalle): boolean {
    const tiposProveedor = new Set((detalle.documentos_proveedor_cuenta ?? []).map((d) => d.tipo_documento));
    const tiposFacturacion = new Set(detalle.documentos.map((d) => d.tipo_documento));
    const todosTipos = new Set([...tiposProveedor, ...tiposFacturacion]);
    return BUNDLE_LEGAL_TIPOS.every((t) => todosTipos.has(t));
}

export function itemCumplido(row: ChecklistRowDef, detalle: FacturacionDetalle | null): boolean {
    if (!detalle) return false;
    const ch = detalle.cuenta.checklist_fo09 ?? {};
    const metadataOk = detalleConvenioMetadataCompleta(detalle);
    switch (row.kind) {
        case "factura_facturacion":
            return hasFacturaCuenta(detalle);
        case "proveedor_rut":
            return proveedorTieneRut(detalle);
        case "bundle_legal":
            return proveedorCumpleBundleLegal(detalle);
        case "viva_gdp02":
            return !!ch["2"] && metadataOk;
        case "viva_gfr07":
            return !!ch["3"] && metadataOk;
        case "viva_gfr16":
            return !!ch["14"] && metadataOk;
        case "opcional":
            return !!ch[String(row.id)];
        default:
            return false;
    }
}

export function labelTipoProveedor(tipo: string): string {
    return LABELS_TIPO_DOCUMENTO[tipo] ?? tipo;
}

export function getDocumentosSoporte(
    row: ChecklistRowDef,
    detalle: FacturacionDetalle | null
): FacturacionDetalleDocumento[] {
    if (!detalle) return [];

    const todosLosDocumentos: FacturacionDetalleDocumento[] = [
        ...detalle.documentos,
        ...(detalle.documentos_proveedor_cuenta ?? []).map((d) => ({
            tipo_documento: d.tipo_documento,
            ruta_archivo: d.url,
            url: d.url,
            etiqueta: null,
        })),
    ];

    switch (row.kind) {
        case "factura_facturacion":
            return todosLosDocumentos.filter(
                (d) => d.tipo_documento === "FACTURA" || /^FACTURA_\d+$/.test(d.tipo_documento)
            );
        case "proveedor_rut":
            return todosLosDocumentos.filter((d) => d.tipo_documento === "RUT");
        case "bundle_legal":
            return todosLosDocumentos.filter((d) =>
                BUNDLE_LEGAL_TIPOS.includes(d.tipo_documento as (typeof BUNDLE_LEGAL_TIPOS)[number])
            );
        case "opcional":
            return todosLosDocumentos.filter((d) => d.tipo_documento === `OPCIONAL_ITEM_${row.id}`);
        default:
            return [];
    }
}

export interface EstadoOpcionalVisual {
    estado: "no-aplica" | "aplica-incompleto" | "completo";
    icono: string;
    color: string;
    bgColor: string;
    borderColor: string;
    texto: string;
}

export function getEstadoOpcional(ok: boolean): EstadoOpcionalVisual {
    if (ok) {
        return {
            estado: "completo",
            icono: "✓",
            color: "text-green-700 dark:text-green-400",
            bgColor: "bg-green-50 dark:bg-green-900/20",
            borderColor: "border-green-200 dark:border-green-700/40",
            texto: "Completo",
        };
    }
    return {
        estado: "no-aplica",
        icono: "○",
        color: "text-gray-400 dark:text-gray-600",
        bgColor: "bg-gray-50 dark:bg-gray-900/20",
        borderColor: "border-gray-200 dark:border-gray-700/40",
        texto: "No aplica para este caso",
    };
}

export function itemsObligatoriosYMarcados(detalle: FacturacionDetalle | null): ChecklistRowDef[] {
    return CHECKLIST_DEF.filter((item) => {
        if (item.required) return true;
        return itemCumplido(item, detalle) && item.kind === "opcional";
    });
}

export function itemsOpcionalesNoMarcados(detalle: FacturacionDetalle | null): ChecklistRowDef[] {
    return CHECKLIST_DEF.filter((item) => {
        if (item.required) return false;
        return !itemCumplido(item, detalle) && item.kind === "opcional";
    });
}

export function resolveItemVariant(item: ChecklistRowDef, detalle: FacturacionDetalle | null): ChecklistItemVariant {
    if (item.required) return "obligatorio";
    if (itemCumplido(item, detalle) && item.kind === "opcional") return "opcionalMarcado";
    return "opcional";
}
