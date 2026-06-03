import "server-only";

import { buildGdpFo02Defaults } from "@/app/viva/components/facturacion/gdp-fo-02/buildGdpFo02Defaults";
import {
    applyGdp02EditableToDefaults,
    mergeGdp02EditableFromSaved,
} from "@/lib/facturacionFormPersistence";
import type { FacturacionDetalle } from "@/services/facturacion.service";
import { formatCurrency, parseCurrencyInputToNumber } from "@/utils/formats";
import type { TramiteBuildContext } from "../types";

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

export function buildGdpFo02Model(ctx: TramiteBuildContext) {
    const saved = ctx.detalle.cuenta.formulario_gdp02;
    if (!saved || saved.completo !== true) {
        throw new Error("El formulario GDP-FO-02 no está guardado y marcado como completado");
    }
    const detalle = asDetalle(ctx);
    const defaults = buildGdpFo02Defaults(detalle);
    const editable = mergeGdp02EditableFromSaved(defaults, saved);
    return applyGdp02EditableToDefaults(defaults, editable);
}

export function buildGdpFo02PrintData(ctx: TramiteBuildContext) {
    const model = buildGdpFo02Model(ctx);
    const totalPago = model.pagoRows.reduce(
        (s, r) => s + parseCurrencyInputToNumber(r.valorPagar),
        0
    );

    return {
        ...model,
        totalPagoTexto: totalPago > 0 ? formatCurrency(totalPago) : "—",
        periodoServicio: `DESDE: ${model.periodoDesde || "—"}  HASTA: ${model.periodoHasta || "—"}`,
        introParrafo: `Con el objeto de informar el avance parcial realizado en la ejecución contractual, se presenta el Informe de supervisión No ${model.numeroInforme} de ${model.anioInforme}, con fundamento en la Ley 1474 de 2011, y demás normas que regulan la materia, aludiendo a las obligaciones de ejecución principal entre las partes:`,
        tablaIntro: `Y se relacionan en el cuadro exhibido, comprobando con esta herramienta, que los materiales fueron entregados acorde a las especificaciones técnicas y cantidades solicitadas según la alianza estratégica ${model.contratoNo || "—"}.`,
        firmaFecha: `Para constancia se firma en ${model.firmaCiudad || "—"}, el ${model.firmaDia || "—"} de ${model.firmaMes || "—"} de ${model.firmaAnio || "—"}.`,
    };
}
