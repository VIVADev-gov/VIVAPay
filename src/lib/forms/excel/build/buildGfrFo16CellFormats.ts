import { GFR_FO_16_CELLS } from "../cellMaps/gfrFo16.cells";
import { EXCEL_NUMFMT_CO, setCellFormat, type CellFormats } from "./formExcelHelpers";

export function buildGfrFo16CellFormats(): CellFormats {
  const formats: CellFormats = {};
  setCellFormat(formats, GFR_FO_16_CELLS.valorPago, EXCEL_NUMFMT_CO.currency);
  return formats;
}
