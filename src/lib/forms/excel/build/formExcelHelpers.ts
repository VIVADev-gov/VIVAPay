import type { PaymentAccountDeclarations } from "@/types/contratos";
import type { CellValues } from "../types";

export function parseIsoDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatPlazoMeses(plazoMeses: number) {
  const plazo = Math.max(0, Math.round(plazoMeses));
  return `${plazo} ${plazo === 1 ? "MES" : "MESES"}`;
}

export function applyDeclarationCells(
  values: CellValues,
  declarations: PaymentAccountDeclarations | null,
  cells: {
    declaracion383Si: string;
    declaracion383No: string;
    declaracionRutSi: string;
    declaracionRutNo: string;
  }
) {
  if (!declarations) return;

  const art383 = declarations.contratoMultiplesTrabajadores;
  values[cells.declaracion383Si] = art383 ? "SI ( X )" : "SI (  )";
  values[cells.declaracion383No] = art383 ? "NO (  )" : "NO (  X)";

  const rut = declarations.rutActualizado;
  values[cells.declaracionRutSi] = rut ? "SI ( X )" : "SI (  )";
  values[cells.declaracionRutNo] = rut ? "NO (  )" : "NO (  X)";
}

export function applyGfrFo11SiNo(
  values: CellValues,
  row: number,
  si: boolean
) {
  values[`G${row}`] = "SI";
  values[`J${row}`] = "NO";
  values[`H${row}`] = si ? "X" : null;
  values[`K${row}`] = si ? null : "X";
}

export function splitDateParts(date: Date | null) {
  if (!date) {
    return { day: null, month: null, year: null };
  }
  return {
    day: date.getUTCDate(),
    month: date.getUTCMonth() + 1,
    year: date.getUTCFullYear(),
  };
}
