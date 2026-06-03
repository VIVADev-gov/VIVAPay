import type { FacturacionVivaDetallePayload } from "@/app/api/viva/facturacion/facturacion-cuenta.service";
import {
    itemsObligatoriosYMarcados,
    type ChecklistRowDef,
} from "@/lib/facturacion/gfrFo09Checklist";
import type { FacturacionDetalle } from "@/services/facturacion.service";
import type { TramiteBuildContext } from "./types";

/** Adapta payload servidor al tipo usado por helpers del checklist en cliente. */
function asFacturacionDetalle(payload: FacturacionVivaDetallePayload): FacturacionDetalle {
    return {
        cuenta: {
            ...payload.cuenta,
            estado: payload.cuenta.estado,
        },
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

export function buildTramiteContext(
    idCuenta: number,
    payload: FacturacionVivaDetallePayload
): TramiteBuildContext {
    const detalleView = asFacturacionDetalle(payload);
    const itemsIncluidos: ChecklistRowDef[] = itemsObligatoriosYMarcados(detalleView);

    return {
        idCuenta,
        detalle: payload,
        itemsIncluidos,
        incluirListaVerificacion: true,
    };
}
