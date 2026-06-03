import "server-only";

import type { FacturacionVivaDetallePayload } from "@/app/api/viva/facturacion/facturacion-cuenta.service";
import {
    CHECKLIST_DEF,
    itemCumplido,
} from "@/lib/facturacion/gfrFo09Checklist";
import type { FacturacionDetalle } from "@/services/facturacion.service";
import { formatFechaHoraDisplay } from "@/utils/date";

function asDetalle(payload: FacturacionVivaDetallePayload): FacturacionDetalle {
    return {
        cuenta: { ...payload.cuenta, estado: payload.cuenta.estado },
        envios: payload.envios.map((e) => ({
            ...e,
            remision: e.remision ?? undefined,
            valor_envio_cop: e.valor_envio_cop,
        })),
        documentos: payload.documentos,
        documentos_proveedor_cuenta: payload.documentos_proveedor_cuenta,
        gfr_fo09_checklist_completo: payload.gfr_fo09_checklist_completo,
    };
}

export function buildGfrFo09PrintData(payload: FacturacionVivaDetallePayload) {
    const detalle = asDetalle(payload);
    const items = CHECKLIST_DEF.map((row) => {
        const cumplido = itemCumplido(row, detalle);
        return {
            id: row.id,
            label: row.label,
            required: row.required,
            cumplido,
            estado: cumplido ? "Cumplido" : row.required ? "Pendiente" : "No aplica / Pendiente",
        };
    });

    return {
        titulo: "CONTROL PARA EL TRÁMITE DE PAGO (GFR-FO-09)",
        proveedor: payload.cuenta.nombre_proveedor?.trim() ?? "",
        nit: payload.cuenta.nit_proveedor?.trim() ?? "",
        radicado: payload.cuenta.radicado?.trim() ?? "",
        fecha: formatFechaHoraDisplay(new Date().toISOString()) || "",
        items,
        checklistCompleto: payload.gfr_fo09_checklist_completo === true,
    };
}
