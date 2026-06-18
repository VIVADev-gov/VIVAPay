import {
  derivePeriodoCorte,
  type PaymentAccountReembolsables,
} from "@/lib/cuentas-cobro/paymentAccountReembolsables";
import {
  GTH_FO_52_CELLS,
  GTH_FO_52_ENCARGO_COLUMNS,
  GTH_FO_52_ENCARGO_MAX_ROWS,
  GTH_FO_52_ENCARGO_START_ROW,
} from "../cellMaps/gthFo52.cells";
import { parseIsoDate } from "./formExcelHelpers";
import type { CellValues } from "../types";
import type { FormPackageContext } from "../types";

function encargoCell(row: number, column: string) {
  return `${column}${row}`;
}

function formatPernocta(value: boolean) {
  return value ? "Si" : "No";
}

export function buildGthFo52Data(ctx: FormPackageContext): CellValues {
  const { contract, contractor, reviewer, paymentAccount } = ctx;
  const reembolsables = ctx.paymentAccount.reembolsables;

  if (!reembolsables) {
    throw new Error("No hay datos de reembolsables para generar GTH-FO-52");
  }

  const values: CellValues = {
    [GTH_FO_52_CELLS.periodoCorte]: derivePeriodoCorte(
      paymentAccount.periodoInicio?.toISOString() ?? null
    ),
    [GTH_FO_52_CELLS.documento]: contractor.documentId,
    [GTH_FO_52_CELLS.nombres]: contractor.name.toUpperCase(),
    [GTH_FO_52_CELLS.area]: contractor.organizationalUnitName,
    [GTH_FO_52_CELLS.coordinador]: reviewer.name.toUpperCase(),
    [GTH_FO_52_CELLS.modalidad]: "CONTRATISTA",
  };

  const encargos = reembolsables.encargos.slice(0, GTH_FO_52_ENCARGO_MAX_ROWS);

  for (let index = 0; index < GTH_FO_52_ENCARGO_MAX_ROWS; index++) {
    const row = GTH_FO_52_ENCARGO_START_ROW + index;
    const encargo = encargos[index];

    if (!encargo) {
      values[encargoCell(row, GTH_FO_52_ENCARGO_COLUMNS.id)] = null;
      values[encargoCell(row, GTH_FO_52_ENCARGO_COLUMNS.contrato)] = null;
      values[encargoCell(row, GTH_FO_52_ENCARGO_COLUMNS.destino)] = null;
      values[encargoCell(row, GTH_FO_52_ENCARGO_COLUMNS.otrosDestinos)] = null;
      values[encargoCell(row, GTH_FO_52_ENCARGO_COLUMNS.zona)] = null;
      values[encargoCell(row, GTH_FO_52_ENCARGO_COLUMNS.fechaSalida)] = null;
      values[encargoCell(row, GTH_FO_52_ENCARGO_COLUMNS.fechaRegreso)] = null;
      values[encargoCell(row, GTH_FO_52_ENCARGO_COLUMNS.pernocta)] = null;
      values[encargoCell(row, GTH_FO_52_ENCARGO_COLUMNS.tipoTransporte)] = null;
      continue;
    }

    values[encargoCell(row, GTH_FO_52_ENCARGO_COLUMNS.id)] = encargo.id;
    values[encargoCell(row, GTH_FO_52_ENCARGO_COLUMNS.contrato)] =
      contract.numeroContrato;
    values[encargoCell(row, GTH_FO_52_ENCARGO_COLUMNS.destino)] =
      encargo.municipioNombre;
    values[encargoCell(row, GTH_FO_52_ENCARGO_COLUMNS.otrosDestinos)] =
      encargo.otrosDestinos ?? null;
    values[encargoCell(row, GTH_FO_52_ENCARGO_COLUMNS.zona)] =
      encargo.subregionNombre;
    values[encargoCell(row, GTH_FO_52_ENCARGO_COLUMNS.fechaSalida)] =
      parseIsoDate(encargo.fechaSalida);
    values[encargoCell(row, GTH_FO_52_ENCARGO_COLUMNS.fechaRegreso)] =
      parseIsoDate(encargo.fechaRegreso);
    values[encargoCell(row, GTH_FO_52_ENCARGO_COLUMNS.pernocta)] =
      formatPernocta(encargo.pernocta);
    values[encargoCell(row, GTH_FO_52_ENCARGO_COLUMNS.tipoTransporte)] =
      encargo.tipoTransporte;
  }

  return values;
}

export function assertGthFo52Reembolsables(
  value: PaymentAccountReembolsables | null | undefined
): PaymentAccountReembolsables {
  if (!value || value.encargos.length === 0) {
    throw new Error(
      "Debes completar los reembolsables antes de generar el paquete"
    );
  }
  return value;
}
