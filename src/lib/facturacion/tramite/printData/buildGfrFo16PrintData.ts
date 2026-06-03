import "server-only";

import type { FacturacionVivaDetallePayload } from "@/app/api/viva/facturacion/facturacion-cuenta.service";
import VERIFICACION_CREDENTIALS from "@/app/viva/constants/certficado";
import {
    disponibilidadesPresupuestalesTexto,
    facturasExternasTexto,
} from "@/lib/facturacionRpDesglose";
import { compromisosRpTexto } from "@/lib/facturacionConvenioPrefill";
import { formatCurrency } from "@/utils/formats";
import type { FacturacionDetalle } from "@/services/facturacion.service";

type VerificacionCredentials = typeof VERIFICACION_CREDENTIALS & { cc?: string };

function ordenadorDocumentoIdentidad(): string {
    const c = VERIFICACION_CREDENTIALS as VerificacionCredentials;
    return (c.documentoIdentidad || c.cc || "").trim();
}

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

export function buildGfrFo16PrintData(payload: FacturacionVivaDetallePayload) {
    const detalle = asDetalle(payload);
    const total = payload.cuenta.fo16_valor_pago_envios_total;
    const valorPago =
        total != null && Number.isFinite(total) && total > 0 ? formatCurrency(total) : "";

    return {
        directorJefe: VERIFICACION_CREDENTIALS.nombre,
        cargoDirectorJefe: VERIFICACION_CREDENTIALS.cargo,
        contratista: payload.cuenta.nombre_proveedor?.trim() ?? "",
        ccNit: payload.cuenta.nit_proveedor?.trim() ?? "",
        numeroContratoConvenio: payload.cuenta.fo16_numero_contrato_convenio?.trim() ?? "",
        numeroDisponibilidad: disponibilidadesPresupuestalesTexto(detalle) || "",
        numeroCompromiso: compromisosRpTexto(detalle) || "",
        numeroFacturaCobro: facturasExternasTexto(detalle),
        valorPago,
        firma: VERIFICACION_CREDENTIALS.nombre,
        direccionJefatura: VERIFICACION_CREDENTIALS.cargo,
        cc: ordenadorDocumentoIdentidad(),
    };
}
