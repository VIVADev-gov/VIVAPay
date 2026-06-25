import {
  GFR_FO_17_HEADER_CELLS,
  type GfrFo17Layout,
} from "../cellMaps/gfrFo17.cells";
import {
  EXCEL_NUMFMT_CO,
  setCellFormat,
  type CellFormats,
} from "./formExcelHelpers";
import type { FormPackageContext } from "../types";

export function buildGfrFo17CellFormats(
  ctx: FormPackageContext,
  layout: GfrFo17Layout
): CellFormats {
  const header = GFR_FO_17_HEADER_CELLS;
  const { cells } = layout;
  const formats: CellFormats = {};
  const currency = EXCEL_NUMFMT_CO.currency;
  const percent = EXCEL_NUMFMT_CO.percent;

  const currencyCells = [
    header.valorCdp,
    header.valorRpc,
    header.valorInicialContrato,
    header.totalRecursosComprometidos,
    header.valorPagoNumeros,
    header.valorActual,
    header.cuentaActualTotal,
    header.ibcSalud,
    header.ibcPension,
    header.ibcArl,
    header.aporteSalud,
    header.aportePension,
    header.aporteArl,
    cells.historialTotalHonorarios,
    cells.historialTotalGastos,
    cells.historialTotalIva,
    cells.valorContractual,
    cells.valorContractualGastos,
    cells.valorContractualIva,
    cells.saldoContractualHonorarios,
    cells.saldoContractualGastos,
    cells.saldoContractualIva,
  ];

  for (const cellRef of currencyCells) {
    setCellFormat(formats, cellRef, currency);
  }

  const percentCells = [
    cells.porcentajeEjecucionFinanciera,
    cells.porcentajeEjecucionFisica,
    header.pctBaseValorCuentaSalud,
    header.pctBaseValorCuentaPension,
    header.pctBaseValorCuentaArl,
    header.pctAporteIbcSalud,
    header.pctAporteIbcPension,
    header.pctAporteIbcArl,
  ];

  for (const cellRef of percentCells) {
    setCellFormat(formats, cellRef, percent);
  }

  for (let index = 0; index < layout.historialRowCount; index++) {
    const row = layout.historialStartRow + index;
    setCellFormat(formats, `F${row}`, currency);
    setCellFormat(formats, `G${row}`, currency);
    setCellFormat(formats, `H${row}`, currency);
    setCellFormat(formats, `I${row}`, currency);
  }

  ctx.activities.forEach((_activity, index) => {
    const row = layout.actividadStartRow + index;
    setCellFormat(formats, `J${row}`, percent);
  });

  return formats;
}
