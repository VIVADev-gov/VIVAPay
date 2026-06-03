/**
 * Márgenes de página tomados de `public/002.INFORME 7 GALVACEROS MPIOS1.docx`
 * (`w:pgMar w:top="1417" w:right="1701" w:bottom="1417" w:left="1701"` en twips).
 * 1 twip = 1/1440 pulgada.
 */
const TWIP_TO_MM = 25.4 / 1440;

export const GDP02_WORD_PAGE_MARGINS_MM = {
    top: 1417 * TWIP_TO_MM,
    right: 1417 * TWIP_TO_MM,
    bottom: 1417 * TWIP_TO_MM,
    left: 1417 * TWIP_TO_MM,
} as const;

/** Espacio entre bloque cabecera gráfica y cuerpo (aprox. una línea). */
export const GDP02_PDF_SECTION_GAP_MM = 2;
