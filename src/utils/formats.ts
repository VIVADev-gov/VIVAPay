/**
 * Formatea un número con puntos como separador de miles (ej: 1234567 -> "1.234.567").
 * Acepta número o string; los decimales se mantienen (ej: 1234.5 -> "1.234.5").
 */
export function formatNumberWithDots(value: number | string): string {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (!Number.isFinite(num)) return String(value);

    const str = String(num);
    const [intPart, decPart] = str.split(".");
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
}

/**
 * Quita puntos y comas de un string numérico para obtener el valor raw (ej: "1.234" -> "1234").
 * Solo usar cuando no hay parte decimal; si hay decimales use parseFormattedNumber.
 */
export function removeDotsOrCommas(value: number | string): string {
    return String(value).replace(/[.,]/g, "");
}

/**
 * Parsea un valor formateado (ej: "1.234.567,89" o "1.234.567.89") a número para enviar al backend.
 * Considera el último punto o coma como separador decimal; el resto son separadores de miles.
 */
export function parseFormattedNumber(value: number | string): number {
    const s = String(value).trim();
    if (!s) return 0;
    const lastDot = s.lastIndexOf(".");
    const lastComma = s.lastIndexOf(",");
    const sep = lastDot > lastComma ? lastDot : lastComma;
    if (sep === -1) {
        const raw = s.replace(/[.\s]/g, "");
        return parseFloat(raw) || 0;
    }
    const intPart = s.slice(0, sep).replace(/[.,\s]/g, "");
    const decPart = s.slice(sep + 1).replace(/[.,\s]/g, "");
    return parseFloat(`${intPart}.${decPart}`) || 0;
}


/**
 * Formatea un valor numérico a formato de moneda colombiana (COP).
 * Ejemplo: 50000 -> "$50.000"
 */
export function formatCurrency(value: number | string): string {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Number.isFinite(num) ? num : 0);
}

/** Valor mostrado como moneda COP (solo dígitos) → número entero para API. */
export function parseCurrencyInputToNumber(value: string): number {
    const digits = String(value).replace(/[^\d]/g, "");
    return digits ? parseInt(digits, 10) : 0;
}

/** Cantidad con miles con punto; si hay coma se toma como decimal. */
export function parseQuantityOfferInput(value: string): number {
    const t = String(value).trim();
    if (t.includes(",")) return parseFormattedNumber(t.replace(/\$/g, ""));
    const n = parseFloat(removeDotsOrCommas(t));
    return Number.isFinite(n) ? n : 0;
}