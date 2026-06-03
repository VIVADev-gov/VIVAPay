import type { FacturacionDetalle } from "@/services/facturacion.service";

/** True cuando Viva registró PDF de factura y número radicado por cada envío de la cuenta. */
export function cuentaFacturasVivaRegistradas(detalle: FacturacionDetalle): boolean {
    const envios = detalle.envios;
    if (envios.length === 0) return false;

    const todosConRadicado = envios.every((e) => (e.numero_radicado?.trim() ?? "").length > 0);
    if (!todosConRadicado) return false;

    const facturas = detalle.documentos.filter((d) => d.tipo_documento === "FACTURA");
    return facturas.length >= envios.length;
}
