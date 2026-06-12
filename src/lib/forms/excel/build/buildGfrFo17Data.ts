import { formatCurrencyInWords } from "@/utils/numberToWords";
import {
  GFR_FO_17_CELLS,
  GFR_FO_17_HISTORIAL_START_ROW,
} from "../cellMaps/gfrFo17.cells";
import type { CellValues, FormPackageContext } from "../types";
import {
  applyDeclarationCells,
  formatPlazoMeses,
  parseIsoDate,
} from "./formExcelHelpers";

function appendHistorialRows(
  values: CellValues,
  ctx: FormPackageContext
) {
  const sorted = [...ctx.paymentAccounts].sort((a, b) => a.numero - b.numero);
  sorted.forEach((account, index) => {
    const row = GFR_FO_17_HISTORIAL_START_ROW + index;
    values[`C${row}`] = account.numero;
    values[`H${row}`] = account.valor ?? 0;
  });
}

function appendActivityRows(values: CellValues, ctx: FormPackageContext) {
  const startRow = GFR_FO_17_CELLS.actividadStartRow;
  ctx.activities.forEach((activity, index) => {
    const row = startRow + index;
    values[`B${row}`] = activity.actividad;
    values[`E${row}`] = activity.accion;
    values[`I${row}`] =
      activity.soporteTipo === "TEXTO"
        ? activity.soporteTexto ?? ""
        : activity.soporteArchivoNombre ?? activity.soporteTexto ?? "";
    values[`J${row}`] = activity.ejecucion / 100;
  });
}

export function buildGfrFo17Data(ctx: FormPackageContext): CellValues {
  const { contract, contractor, reviewer, paymentAccount, seguridadSocialMetadata } =
    ctx;
  const valor = paymentAccount.valor ?? 0;
  const totalPagado = ctx.paymentAccounts
    .filter((account) => account.numero < paymentAccount.numero)
    .reduce((sum, account) => sum + (account.valor ?? 0), 0);

  const values: CellValues = {
    [GFR_FO_17_CELLS.contratista]: contractor.name,
    [GFR_FO_17_CELLS.tipoDocumento]: "CC",
    [GFR_FO_17_CELLS.documentoContratista]: contractor.documentId,
    [GFR_FO_17_CELLS.numeroContrato]: contract.numeroContrato,
    [GFR_FO_17_CELLS.dependenciaContratante]: contractor.organizationalUnitName,
    [GFR_FO_17_CELLS.nombreSupervisor]: reviewer.name,
    [GFR_FO_17_CELLS.documentoSupervisor]: reviewer.documentId,
    [GFR_FO_17_CELLS.objeto]: contract.objeto,
    [GFR_FO_17_CELLS.plazoMeses]: formatPlazoMeses(contract.plazoMeses),
    [GFR_FO_17_CELLS.fechaActaInicio]: contract.fechaActaInicio,
    [GFR_FO_17_CELLS.fechaFinal]: contract.fechaFinal,
    [GFR_FO_17_CELLS.concepto]: contract.concepto,
    [GFR_FO_17_CELLS.rubro]: contract.rubro,
    [GFR_FO_17_CELLS.cdp]: contract.cdp,
    [GFR_FO_17_CELLS.valorCdp]: contract.valorCdp,
    [GFR_FO_17_CELLS.rpc]: contract.rpc,
    [GFR_FO_17_CELLS.valorRpc]: contract.valorRpc,
    [GFR_FO_17_CELLS.valorInicialContrato]: contract.valorInicialContrato,
    [GFR_FO_17_CELLS.totalRecursosComprometidos]:
      contract.totalRecursosComprometidos,
    [GFR_FO_17_CELLS.cuentaNumero]: paymentAccount.numero,
    [GFR_FO_17_CELLS.periodoDesde]: paymentAccount.periodoInicio,
    [GFR_FO_17_CELLS.periodoHasta]: paymentAccount.periodoFin,
    [GFR_FO_17_CELLS.valorPagoNumeros]: valor,
    [GFR_FO_17_CELLS.valorPagoLetras]: formatCurrencyInWords(valor),
    [GFR_FO_17_CELLS.disponibilidadActual]: contract.numeroDisponibilidad,
    [GFR_FO_17_CELLS.compromisoActual]: contract.numeroCompromiso,
    [GFR_FO_17_CELLS.rubroActual]: contract.rubro,
    [GFR_FO_17_CELLS.conceptoActual]: contract.concepto,
    [GFR_FO_17_CELLS.centroCostoActual]: process.env.GFR_FO_17_CENTRO_COSTO ?? "",
    [GFR_FO_17_CELLS.valorActual]: valor,
    [GFR_FO_17_CELLS.porcentajeEjecucionFinanciera]:
      contract.valorInicialContrato > 0
        ? totalPagado / contract.valorInicialContrato
        : 0,
    [GFR_FO_17_CELLS.porcentajeEjecucionFisica]:
      contract.plazoMeses > 0
        ? paymentAccount.numero / contract.plazoMeses
        : 0,
    [GFR_FO_17_CELLS.documentoContratistaFirma]: contractor.documentId,
    [GFR_FO_17_CELLS.tipoInforme]:
      paymentAccount.numero >= ctx.paymentAccounts.length ? "Final" : "Parcial",
    [GFR_FO_17_CELLS.documentoSupervisorFirma]: reviewer.documentId,
    [GFR_FO_17_CELLS.fechaExpedicion]:
      paymentAccount.periodoFin ?? parseIsoDate(new Date().toISOString()),
  };

  if (seguridadSocialMetadata) {
    values[GFR_FO_17_CELLS.planillaSalud] =
      seguridadSocialMetadata.plantillaEps;
    values[GFR_FO_17_CELLS.planillaPension] =
      seguridadSocialMetadata.plantillaPension;
    values[GFR_FO_17_CELLS.planillaArl] = seguridadSocialMetadata.plantillaArl;
  }

  applyDeclarationCells(values, paymentAccount.declaracionesJuradas, {
    declaracion383Si: GFR_FO_17_CELLS.declaracion383Si,
    declaracion383No: GFR_FO_17_CELLS.declaracion383No,
    declaracionRutSi: GFR_FO_17_CELLS.declaracionRutSi,
    declaracionRutNo: GFR_FO_17_CELLS.declaracionRutNo,
  });

  appendHistorialRows(values, ctx);
  appendActivityRows(values, ctx);

  return values;
}
