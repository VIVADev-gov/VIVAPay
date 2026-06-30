export const GFR_FO_17_HEADER_CELLS = {
  contratista: "C4",
  tipoDocumento: "G4",
  documentoContratista: "H4",
  numeroContrato: "C6",
  dependenciaContratante: "G6",
  nombreSupervisor: "C8",
  documentoSupervisor: "H8",
  objeto: "B10",
  plazoMeses: "B15",
  fechaActaInicio: "C15",
  fechaFinal: "D15",
  concepto: "E15",
  rubro: "F15",
  cdp: "G15",
  valorCdp: "H15",
  rpc: "I15",
  valorRpc: "J15",
  valorInicialContrato: "K15",
  totalRecursosComprometidos: "K23",
  cuentaNumero: "E27",
  periodoDesde: "C29",
  periodoHasta: "G29",
  valorPagoNumeros: "C31",
  valorPagoLetras: "C32",
  planillaSalud: "F36",
  planillaPension: "G36",
  planillaArl: "H36",
  ibcSalud: "F37",
  ibcPension: "G37",
  ibcArl: "H37",
  aporteSalud: "F38",
  aportePension: "G38",
  aporteArl: "H38",
  pctBaseValorCuentaSalud: "F39",
  pctBaseValorCuentaPension: "G39",
  pctBaseValorCuentaArl: "H39",
  pctAporteIbcSalud: "F40",
  pctAporteIbcPension: "G40",
  pctAporteIbcArl: "H40",
  disponibilidadActual: "B44",
  compromisoActual: "D44",
  rubroActual: "F44",
  conceptoActual: "G44",
  centroCostoActual: "H44",
  valorActual: "J44",
  cuentaActualTotal: "J50",
} as const;

/** @deprecated Use GFR_FO_17_HEADER_CELLS or getGfrFo17Layout().cells */
export const GFR_FO_17_CELLS = {
  ...GFR_FO_17_HEADER_CELLS,
  historialTotalHonorarios: "F59",
  historialTotalGastos: "G59",
  historialTotalIva: "H59",
  valorContractual: "F60",
  valorContractualGastos: "G60",
  valorContractualIva: "H60",
  saldoContractualHonorarios: "F61",
  saldoContractualGastos: "G61",
  saldoContractualIva: "H61",
  declaracion383Si: "D67",
  declaracion383No: "F67",
  declaracionRutSi: "D71",
  declaracionRutNo: "F71",
  porcentajeEjecucionFinanciera: "E76",
  porcentajeEjecucionFisica: "J76",
  actividadStartRow: 80,
  documentoContratistaFirma: "H123",
  tipoInforme: "E129",
  documentoSupervisorFirma: "B136",
  fechaExpedicion: "G135",
} as const;

export const GFR_FO_17_HISTORIAL_START_ROW = 53;
export const GFR_FO_17_HISTORIAL_BASE_ROWS = 6;

/** @deprecated Use getGfrFo17Layout().historialRowCount */
export const GFR_FO_17_HISTORIAL_MAX_ROWS = GFR_FO_17_HISTORIAL_BASE_ROWS;

const LAYOUT_BASE = {
  totalRow: 59,
  valorRow: 60,
  saldoRow: 61,
  declaracion383Si: "D67",
  declaracion383No: "F67",
  declaracionRutSi: "D71",
  declaracionRutNo: "F71",
  porcentajeEjecucionFinanciera: "E76",
  porcentajeEjecucionFisica: "J76",
  actividadStartRow: 80,
  documentoContratistaFirma: "H123",
  tipoInforme: "E129",
  documentoSupervisorFirma: "B136",
  fechaExpedicion: "G135",
  trimRowsAfter: 143,
  /**
   * Ancla superior de firma (plantilla public/forms/02.xlsx, hoja GFR-FO-17).
   * row/col usan rejilla ExcelJS (0-based; col 1 = B).
   * El tamaño se define en píxeles (ext) respetando proporción; ver formSignatureExtents.ts.
   * - Contratista: esquina superior del merge B123:C123
   * - Supervisor: esquina superior del merge B134:C135
   */
  signatureContratistaTlCol: 1,
  signatureContratistaTlRow: 122,
  signatureSupervisorTlCol: 1,
  signatureSupervisorTlRow: 133,
} as const;

export type GfrFo17Layout = {
  historialRowCount: number;
  historialStartRow: number;
  historialEndRow: number;
  totalRow: number;
  valorRow: number;
  saldoRow: number;
  cells: {
    historialTotalHonorarios: string;
    historialTotalGastos: string;
    historialTotalIva: string;
    valorContractual: string;
    valorContractualGastos: string;
    valorContractualIva: string;
    saldoContractualHonorarios: string;
    saldoContractualGastos: string;
    saldoContractualIva: string;
    declaracion383Si: string;
    declaracion383No: string;
    declaracionRutSi: string;
    declaracionRutNo: string;
    porcentajeEjecucionFinanciera: string;
    porcentajeEjecucionFisica: string;
    documentoContratistaFirma: string;
    tipoInforme: string;
    documentoSupervisorFirma: string;
    fechaExpedicion: string;
  };
  actividadStartRow: number;
  trimRowsAfter: number;
  signatureAnchors: {
    contratista: {
      tl: { col: number; row: number };
    };
    supervisor: {
      tl: { col: number; row: number };
    };
  };
};

function shiftCellRow(cellRef: string, extraRows: number) {
  const match = /^([A-Z]+)(\d+)$/.exec(cellRef);
  if (!match) return cellRef;
  return `${match[1]}${Number(match[2]) + extraRows}`;
}

export function getGfrFo17Layout(historialRowCount: number): GfrFo17Layout {
  const rows = Math.max(GFR_FO_17_HISTORIAL_BASE_ROWS, historialRowCount);
  const extra = rows - GFR_FO_17_HISTORIAL_BASE_ROWS;
  const historialStartRow = GFR_FO_17_HISTORIAL_START_ROW;
  const historialEndRow = historialStartRow + rows - 1;
  const totalRow = historialEndRow + 1;
  const valorRow = totalRow + 1;
  const saldoRow = totalRow + 2;

  return {
    historialRowCount: rows,
    historialStartRow,
    historialEndRow,
    totalRow,
    valorRow,
    saldoRow,
    cells: {
      historialTotalHonorarios: `F${totalRow}`,
      historialTotalGastos: `G${totalRow}`,
      historialTotalIva: `H${totalRow}`,
      valorContractual: `F${valorRow}`,
      valorContractualGastos: `G${valorRow}`,
      valorContractualIva: `H${valorRow}`,
      saldoContractualHonorarios: `F${saldoRow}`,
      saldoContractualGastos: `G${saldoRow}`,
      saldoContractualIva: `H${saldoRow}`,
      declaracion383Si: shiftCellRow(LAYOUT_BASE.declaracion383Si, extra),
      declaracion383No: shiftCellRow(LAYOUT_BASE.declaracion383No, extra),
      declaracionRutSi: shiftCellRow(LAYOUT_BASE.declaracionRutSi, extra),
      declaracionRutNo: shiftCellRow(LAYOUT_BASE.declaracionRutNo, extra),
      porcentajeEjecucionFinanciera: shiftCellRow(
        LAYOUT_BASE.porcentajeEjecucionFinanciera,
        extra
      ),
      porcentajeEjecucionFisica: shiftCellRow(
        LAYOUT_BASE.porcentajeEjecucionFisica,
        extra
      ),
      documentoContratistaFirma: shiftCellRow(
        LAYOUT_BASE.documentoContratistaFirma,
        extra
      ),
      tipoInforme: shiftCellRow(LAYOUT_BASE.tipoInforme, extra),
      documentoSupervisorFirma: shiftCellRow(
        LAYOUT_BASE.documentoSupervisorFirma,
        extra
      ),
      fechaExpedicion: shiftCellRow(LAYOUT_BASE.fechaExpedicion, extra),
    },
    actividadStartRow: LAYOUT_BASE.actividadStartRow + extra,
    trimRowsAfter: LAYOUT_BASE.trimRowsAfter + extra,
    signatureAnchors: {
      contratista: {
        tl: {
          col: LAYOUT_BASE.signatureContratistaTlCol,
          row: LAYOUT_BASE.signatureContratistaTlRow + extra,
        },
      },
      supervisor: {
        tl: {
          col: LAYOUT_BASE.signatureSupervisorTlCol,
          row: LAYOUT_BASE.signatureSupervisorTlRow + extra,
        },
      },
    },
  };
}

export const GFR_FO_17_SIGNATURE_ANCHORS = {
  contratista: {
    tl: {
      col: LAYOUT_BASE.signatureContratistaTlCol,
      row: LAYOUT_BASE.signatureContratistaTlRow,
    },
  },
  supervisor: {
    tl: {
      col: LAYOUT_BASE.signatureSupervisorTlCol,
      row: LAYOUT_BASE.signatureSupervisorTlRow,
    },
  },
} as const;
