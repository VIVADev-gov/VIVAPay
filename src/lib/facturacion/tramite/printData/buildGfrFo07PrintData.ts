import "server-only";

import type { FacturacionVivaDetallePayload } from "@/app/api/viva/facturacion/facturacion-cuenta.service";
import {
    disponibilidadConvenioTexto,
    primerConvenioDelDetalle,
    CONVENIO_METADATA_INCOMPLETE_MSG,
} from "@/lib/facturacionConvenioPrefill";
import { flattenRpDesgloseFromDetalle } from "@/lib/facturacionRpDesglose";
import { formatCurrency } from "@/utils/formats";
import { formatFechaHoraDisplay } from "@/utils/date";
import type { FacturacionDetalle } from "@/services/facturacion.service";

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

function tableRows(detalle: FacturacionDetalle | null) {
    const lines = flattenRpDesgloseFromDetalle(detalle);
    const envioById = new Map((detalle?.envios ?? []).map((e) => [e.id_envio, e]));

    if (lines.length === 0) {
        const conv = primerConvenioDelDetalle(detalle);
        return [
            {
                disponibilidad:
                    disponibilidadConvenioTexto(conv) ||
                    (conv && !conv.metadata_completa ? CONVENIO_METADATA_INCOMPLETE_MSG : ""),
                registro: "",
                rubro: conv?.rubro_presupuestal?.trim() ?? "",
                cuentaCorriente: "",
                concepto: conv?.concepto?.trim() ?? "",
                centroCosto: conv?.centro_costo?.trim() ?? "",
                valor: "",
            },
        ];
    }

    return lines.map((line) => {
        const ev = envioById.get(line.id_envio);
        const conv = ev?.convenio ?? null;
        return {
            disponibilidad:
                disponibilidadConvenioTexto(conv) ||
                (conv && !conv.metadata_completa ? CONVENIO_METADATA_INCOMPLETE_MSG : ""),
            registro: line.numero_rp?.trim() || "",
            rubro: conv?.rubro_presupuestal?.trim() ?? "",
            cuentaCorriente: "",
            concepto: conv?.concepto?.trim() ?? "",
            centroCosto: conv?.centro_costo?.trim() ?? "",
            valor: line.monto_cop > 0 ? formatCurrency(line.monto_cop) : "",
        };
    });
}

export function buildGfrFo07PrintData(payload: FacturacionVivaDetallePayload) {
    const detalle = asDetalle(payload);
    const conv = primerConvenioDelDetalle(detalle);
    const fo07 = payload.cuenta.formulario_fo07 ?? {};
    const certifico = fo07.certifico === true;

    return {
        contratista: payload.cuenta.nombre_proveedor?.trim() ?? "",
        noContrato:
            conv?.numero_contrato?.trim() ?? payload.cuenta.fo16_numero_contrato_convenio?.trim() ?? "",
        objeto: conv?.objeto_convenio?.trim() ?? "",
        periodoDesde: formatFechaHoraDisplay(payload.cuenta.periodo_desde) || "",
        periodoHasta: formatFechaHoraDisplay(payload.cuenta.periodo_hasta) || "",
        valorPago:
            payload.cuenta.fo16_valor_pago_envios_total != null &&
            payload.cuenta.fo16_valor_pago_envios_total > 0
                ? formatCurrency(payload.cuenta.fo16_valor_pago_envios_total)
                : "",
        certifico,
        certificoTexto: certifico ? "Sí" : "No",
        tableRows: tableRows(detalle),
    };
}
