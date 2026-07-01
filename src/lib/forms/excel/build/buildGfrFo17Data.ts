import { formatCurrencyInWords } from "@/utils/numberToWords";
import {
  GFR_FO_17_HEADER_CELLS,
  type GfrFo17Layout,
} from "../cellMaps/gfrFo17.cells";
import { getGfrFo17Config } from "../config/gfrFo17.config";
import type {
  CellValues,
  FormPackageContext,
  FormPaymentAccountSnapshot,
} from "../types";
import {
  applyGfrFo17SeguridadSocialCells,
  computeGfrFo17SeguridadSocialAportes,
} from "./buildGfrFo17SeguridadSocial";
import {
  getGfrFo17HistorialAccounts,
  isGfrFo17HistorialEligible,
} from "./gfrFo17Historial";
import {
  resolveEjecucionFractionsForPdf,
} from "@/lib/cuentas-cobro/paymentAccountEjecucionGfrFo17";
import {
  applyDeclarationCells,
  formatPlazoMeses,
  parseIsoDate,
} from "./formExcelHelpers";

function clearHistorialRow(values: CellValues, row: number) {
  values[`C${row}`] = "";
  values[`D${row}`] = "";
  values[`E${row}`] = "";
  values[`F${row}`] = "";
  values[`G${row}`] = "";
  values[`I${row}`] = "";
}

function fillHistorialRow(
  values: CellValues,
  row: number,
  account: FormPaymentAccountSnapshot,
  valorContrato: number,
  honorariosAcum: number,
  currentNumero: number
) {
  const honorario = account.valor ?? 0;
  const saldo = valorContrato - honorariosAcum;

  values[`C${row}`] = account.numero;
  values[`D${row}`] = account.fechaEnvio ?? "";
  values[`E${row}`] = resolveHistorialPaymentDate(account, currentNumero);
  values[`F${row}`] = honorario;
  values[`G${row}`] = 0;
  values[`I${row}`] = saldo;
}

function resolveHistorialPaymentDate(
  account: FormPaymentAccountSnapshot,
  currentNumero: number
): Date | "" {
  if (account.numero === currentNumero) {
    return "";
  }
  if (account.fechaPago) {
    return account.fechaPago;
  }
  return "";
}

function appendHistorialRows(
  values: CellValues,
  ctx: FormPackageContext,
  layout: GfrFo17Layout
) {
  const currentNumero = ctx.paymentAccount.numero;
  const valorContrato = ctx.contract.valorInicialContrato;
  const accountsByNumero = new Map(
    ctx.paymentAccounts.map((account) => [account.numero, account])
  );
  const eligibleAccounts = getGfrFo17HistorialAccounts(
    ctx.paymentAccounts,
    currentNumero
  );
  const totalHonorarios = eligibleAccounts.reduce(
    (sum, account) => sum + (account.valor ?? 0),
    0
  );

  let honorariosAcum = 0;

  for (let index = 0; index < layout.historialRowCount; index++) {
    const row = layout.historialStartRow + index;
    const numero = index + 1;
    const account = accountsByNumero.get(numero);

    if (!account || !isGfrFo17HistorialEligible(account, currentNumero)) {
      clearHistorialRow(values, row);
      continue;
    }

    honorariosAcum += account.valor ?? 0;
    fillHistorialRow(
      values,
      row,
      account,
      valorContrato,
      honorariosAcum,
      currentNumero
    );
  }

  const saldoContractual = valorContrato - totalHonorarios;
  const { cells } = layout;

  values[cells.historialTotalHonorarios] = totalHonorarios;
  values[cells.historialTotalGastos] = 0;
  values[cells.historialTotalIva] = totalHonorarios;
  values[cells.valorContractual] = valorContrato;
  values[cells.valorContractualGastos] = 0;
  values[cells.valorContractualIva] = valorContrato;
  values[cells.saldoContractualHonorarios] = saldoContractual;
  values[cells.saldoContractualGastos] = 0;
  values[cells.saldoContractualIva] = saldoContractual;
}

function appendActivityRows(
  values: CellValues,
  ctx: FormPackageContext,
  actividadStartRow: number
) {
  ctx.activities.forEach((activity, index) => {
    const row = actividadStartRow + index;
    values[`B${row}`] = activity.actividad;
    values[`E${row}`] = activity.accion;
    values[`I${row}`] =
      activity.soporteTipo === "TEXTO"
        ? activity.soporteTexto ?? ""
        : activity.soporteArchivoNombre ?? activity.soporteTexto ?? "";
    values[`J${row}`] = activity.ejecucion / 100;
  });
}

export function buildGfrFo17Data(
  ctx: FormPackageContext,
  layout: GfrFo17Layout
): CellValues {
  const { contract, contractor, reviewer, paymentAccount, seguridadSocialMetadata } =
    ctx;
  const header = GFR_FO_17_HEADER_CELLS;
  const { cells } = layout;
  const valor = paymentAccount.valor ?? 0;
  const ejecucion = resolveEjecucionFractionsForPdf(
    paymentAccount,
    ctx.paymentAccounts
  );

  const values: CellValues = {
    [header.contratista]: contractor.name.toUpperCase(),
    [header.tipoDocumento]: "CC",
    [header.documentoContratista]: contractor.documentId,
    [header.numeroContrato]: contract.numeroContrato,
    [header.dependenciaContratante]: contractor.organizationalUnitName,
    [header.nombreSupervisor]: reviewer.name.toUpperCase(),
    [header.documentoSupervisor]: reviewer.documentId,
    [header.objeto]: contract.objeto,
    [header.plazoMeses]: formatPlazoMeses(contract.plazoMeses),
    [header.fechaActaInicio]: contract.fechaActaInicio,
    [header.fechaFinal]: contract.fechaFinal,
    [header.concepto]: contract.concepto,
    [header.rubro]: contract.rubro,
    [header.cdp]: contract.cdp,
    [header.valorCdp]: contract.valorCdp,
    [header.rpc]: contract.rpc,
    [header.valorRpc]: contract.valorRpc,
    [header.valorInicialContrato]: contract.valorInicialContrato,
    [header.totalRecursosComprometidos]: contract.totalRecursosComprometidos,
    [header.cuentaNumero]: paymentAccount.numero,
    [header.periodoDesde]: paymentAccount.periodoInicio,
    [header.periodoHasta]: paymentAccount.periodoFin,
    [header.valorPagoNumeros]: valor,
    [header.valorPagoLetras]: formatCurrencyInWords(valor),
    [header.disponibilidadActual]: contract.numeroDisponibilidad,
    [header.compromisoActual]: contract.numeroCompromiso,
    [header.rubroActual]: contract.rubro,
    [header.conceptoActual]: contract.concepto,
    [header.centroCostoActual]: process.env.GFR_FO_17_CENTRO_COSTO ?? "",
    [header.valorActual]: valor,
    [header.cuentaActualTotal]: valor,
    [cells.porcentajeEjecucionFinanciera]: ejecucion.financiera,
    [cells.porcentajeEjecucionFisica]: ejecucion.fisica,
    [cells.documentoContratistaFirma]: contractor.documentId,
    [cells.tipoInforme]:
      paymentAccount.numero >= ctx.paymentAccounts.length ? "Final" : "Parcial",
    [cells.documentoSupervisorFirma]: reviewer.documentId,
    [cells.fechaExpedicion]:
      paymentAccount.periodoFin ?? parseIsoDate(new Date().toISOString()),
  };

  if (seguridadSocialMetadata) {
    values[header.planillaSalud] = seguridadSocialMetadata.plantillaEps;
    values[header.planillaPension] = seguridadSocialMetadata.plantillaPension;
    values[header.planillaArl] = seguridadSocialMetadata.plantillaArl;

    if (valor > 0) {
      const config = getGfrFo17Config();
      if (config.smmlv > 0) {
        const aportes = computeGfrFo17SeguridadSocialAportes(
          valor,
          config,
          seguridadSocialMetadata.aportesManuales
        );
        applyGfrFo17SeguridadSocialCells(values, header, aportes);
      }
    }
  }

  applyDeclarationCells(values, paymentAccount.declaracionesJuradas, {
    declaracion383Si: cells.declaracion383Si,
    declaracion383No: cells.declaracion383No,
    declaracionRutSi: cells.declaracionRutSi,
    declaracionRutNo: cells.declaracionRutNo,
  });

  appendHistorialRows(values, ctx, layout);
  appendActivityRows(values, ctx, layout.actividadStartRow);

  return values;
}
