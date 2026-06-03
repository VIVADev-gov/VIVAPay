import type { GdpFo02FormModel } from "@/app/viva/components/facturacion/gdp-fo-02/gdpFo02Types";

const TEXTO_AUTORIZACION_CIERRE =
    "En consecuencia, se autoriza la cancelación de la presente cuenta, de conformidad con la ejecución verificada en el periodo.";

/** Primer grupo de dígitos en el texto del contrato (para el título «CONTRATO No …»). */
export function extractContratoNumeroTitulo(contratoNo: string): string {
    const m = contratoNo.trim().match(/\d+/);
    return m ? m[0] : "—";
}

function splitFirmaCargo(cargo: string): { firmaCargo: string; firmaCargoLinea2: string } {
    const t = cargo.trim();
    const parts = t.split(/\s*[–—]\s*/);
    if (parts.length >= 2) {
        return { firmaCargo: parts[0].trim(), firmaCargoLinea2: parts.slice(1).join(" – ").trim() };
    }
    const nl = t.split(/\n/);
    if (nl.length >= 2) {
        return { firmaCargo: nl[0].trim(), firmaCargoLinea2: nl.slice(1).join(" ").trim() };
    }
    return { firmaCargo: t, firmaCargoLinea2: "" };
}

function buildParrafoIntro(model: GdpFo02FormModel): string {
    return (
        `Con el objeto de informar el avance parcial realizado en la ejecución contractual, se presenta el ` +
        `Informe de supervisión No ${model.numeroInforme.trim() || "—"} de ${model.anioInforme.trim() || "—"}, ` +
        `con fundamento en la Ley 1474 de 2011 y demás normas que regulan la materia, aludiendo a las obligaciones ` +
        `de ejecución principal entre las partes:`
    );
}

function buildFirmaLineaFecha(model: GdpFo02FormModel): string {
    const ciudad = model.firmaCiudad.trim();
    const base = `Para constancia se firma el día ${model.firmaDia.trim()} de ${model.firmaMes.trim()} de ${model.firmaAnio.trim()}.`;
    return ciudad ? `${base} ${ciudad}.` : base;
}

/** Datos para docxtemplater (marcadores `{campo}` en la plantilla Word). */
export function buildGdpFo02DocxData(model: GdpFo02FormModel): Record<string, unknown> {
    const { firmaCargo, firmaCargoLinea2 } = splitFirmaCargo(model.firmaCargo);
    return {
        contratista: model.contratista,
        contratoNo: model.contratoNo,
        contratoNumeroTitulo: extractContratoNumeroTitulo(model.contratoNo),
        numeroInforme: model.numeroInforme,
        objetoContrato: model.objetoContrato,
        valorContrato: model.valorContrato,
        fechaInicio: model.fechaInicio,
        plazoInicial: model.plazoInicial,
        fechaTerminacion: model.fechaTerminacion,
        periodoDesde: model.periodoDesde,
        periodoHasta: model.periodoHasta,
        parrafoIntro: buildParrafoIntro(model),
        textoAutorizacionCierre: TEXTO_AUTORIZACION_CIERRE,
        valorAutorizadoTexto: model.valorAutorizadoTexto,
        firmaLineaFecha: buildFirmaLineaFecha(model),
        firmaNombre: model.firmaNombre,
        firmaCargo,
        firmaCargoLinea2,
        firmaEntidad: model.firmaEntidad,
        executionRows: model.executionRows.map((r) => ({
            convenio: r.convenio,
            fecha: r.fecha,
            remision: r.remision,
            noFactura: r.noFactura,
        })),
        pagoRows: model.pagoRows.map((r) => ({
            disponibilidad: r.disponibilidad,
            compromiso: r.compromiso,
            convenio: r.convenio,
            noFactura: r.noFactura,
            valorPagar: r.valorPagar,
        })),
    };
}
