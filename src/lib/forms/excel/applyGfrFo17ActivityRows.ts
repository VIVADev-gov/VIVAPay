import "server-only";

import type ExcelJS from "exceljs";

export type GfrFo17ActivitiesLayout = {
  startRow: number;
  count: number;
};

const ACTIVITY_COLUMNS = [2, 5, 9, 10] as const; // B, E, I, J
const MIN_ROW_HEIGHT = 15;
const LINE_HEIGHT_PT = 13.5;
const DEFAULT_COL_WIDTH = 8.43;

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return "";
  return String(value);
}

function columnWidthChars(
  sheet: ExcelJS.Worksheet,
  startCol: number,
  endCol: number
): number {
  let width = 0;
  for (let col = startCol; col <= endCol; col++) {
    width += sheet.getColumn(col).width ?? DEFAULT_COL_WIDTH;
  }
  return Math.max(8, width);
}

function wrappedLines(text: string, charsPerLine: number): number {
  const normalized = text.trim();
  if (!normalized) return 1;
  return Math.ceil(normalized.length / charsPerLine);
}

function rowHeightForTexts(
  sheet: ExcelJS.Worksheet,
  actividad: string,
  accion: string,
  soporte: string
): number {
  const lines = Math.max(
    wrappedLines(actividad, columnWidthChars(sheet, 2, 4)),
    wrappedLines(accion, columnWidthChars(sheet, 5, 8)),
    wrappedLines(soporte, columnWidthChars(sheet, 9, 9)),
    1
  );
  return Math.max(MIN_ROW_HEIGHT, Math.ceil(lines * LINE_HEIGHT_PT + 4));
}

function ensureRowMerge(sheet: ExcelJS.Worksheet, range: string) {
  const merges = ((sheet.model as { merges?: string[] }).merges ??
    []) as string[];
  if (!merges.includes(range)) {
    sheet.mergeCells(range);
  }
}

function applyActivityCellStyle(cell: ExcelJS.Cell) {
  cell.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
}

export function applyGfrFo17ActivityRows(
  sheet: ExcelJS.Worksheet,
  layout: GfrFo17ActivitiesLayout
) {
  const { startRow, count } = layout;
  if (count <= 0) return;

  for (let index = 0; index < count; index++) {
    const row = startRow + index;
    ensureRowMerge(sheet, `B${row}:D${row}`);
    ensureRowMerge(sheet, `E${row}:H${row}`);

    const actividad = cellText(sheet.getCell(`B${row}`).value);
    const accion = cellText(sheet.getCell(`E${row}`).value);
    const soporte = cellText(sheet.getCell(`I${row}`).value);

    const rowRef = sheet.getRow(row);
    for (const col of ACTIVITY_COLUMNS) {
      applyActivityCellStyle(rowRef.getCell(col));
    }

    rowRef.height = rowHeightForTexts(sheet, actividad, accion, soporte);
  }
}
