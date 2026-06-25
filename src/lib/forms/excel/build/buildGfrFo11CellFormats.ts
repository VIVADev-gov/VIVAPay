import { GFR_FO_11_CELLS } from "../cellMaps/gfrFo11.cells";
import { EXCEL_NUMFMT_CO, setCellFormat, type CellFormats } from "./formExcelHelpers";

export function buildGfrFo11CellFormats(): CellFormats {
  const formats: CellFormats = {};
  const currency = EXCEL_NUMFMT_CO.currency;
  const integer = EXCEL_NUMFMT_CO.number;

  const currencyCells = [
    GFR_FO_11_CELLS.ingresosAnioAnteriorValor,
    GFR_FO_11_CELLS.ingresosAnioActualValor,
    GFR_FO_11_CELLS.contratosServiciosAnioAnteriorValor,
    GFR_FO_11_CELLS.contratosServiciosAnioActualValor,
    GFR_FO_11_CELLS.contratosEstadoAnioAnteriorValor,
    GFR_FO_11_CELLS.contratosEstadoAnioActualValor,
    GFR_FO_11_CELLS.consignacionesAnioAnteriorValor,
    GFR_FO_11_CELLS.consignacionesAnioActualValor,
  ];

  for (const cellRef of currencyCells) {
    setCellFormat(formats, cellRef, currency);
  }

  setCellFormat(formats, GFR_FO_11_CELLS.uvtAnioAnterior, integer);
  setCellFormat(formats, GFR_FO_11_CELLS.uvtAnioActual, integer);

  return formats;
}
