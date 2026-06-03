
/**
 * Calcula y agrega el impuesto a un precio de venta dado un porcentaje de impuesto.
 *
 * @param precio_venta Precio base sin impuesto
 * @param porcentajeImpuesto Porcentaje del impuesto (por ejemplo: 19 para 19%)
 * @returns precio final con impuesto incluido
 */
export const agregarImpuestoAPrecio = (
    precio_venta: number,
    porcentajeImpuesto: number
): number => {
    if (
        typeof precio_venta !== "number" ||
        typeof porcentajeImpuesto !== "number"
    ) {
        return precio_venta;
    }
    const impuesto = precio_venta * (porcentajeImpuesto / 100);
    return +(precio_venta + impuesto).toFixed(2);
};
