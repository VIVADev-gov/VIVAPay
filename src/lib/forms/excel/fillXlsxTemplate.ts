import "server-only";

import ExcelJS from "exceljs";
import path from "path";
import type { CellValues } from "./types";

export type FillXlsxOptions = {
  trimRowsAfter?: number;
  printArea?: string;
};

function resolveWorksheet(workbook: ExcelJS.Workbook, sheetName: string) {
  const exact = workbook.getWorksheet(sheetName);
  if (exact) return exact;

  const normalized = sheetName.trim().toLowerCase();
  return workbook.worksheets.find(
    (sheet) => sheet.name.trim().toLowerCase() === normalized
  );
}

export async function fillXlsxTemplate(
  templateRelPath: string,
  sheetName: string,
  values: CellValues,
  options?: FillXlsxOptions
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(process.cwd(), templateRelPath));

  const sheet = resolveWorksheet(workbook, sheetName);
  if (!sheet) {
    throw new Error(`Hoja no encontrada en ${templateRelPath}: ${sheetName}`);
  }

  for (const [cellRef, value] of Object.entries(values)) {
    if (value === undefined || value === null) continue;
    sheet.getCell(cellRef).value = value;
  }

  if (options?.trimRowsAfter != null && sheet.rowCount > options.trimRowsAfter) {
    for (let rowNumber = options.trimRowsAfter + 1; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.value = null;
      });
    }
    const rowsToRemove = sheet.rowCount - options.trimRowsAfter;
    if (rowsToRemove > 0) {
      sheet.spliceRows(options.trimRowsAfter + 1, rowsToRemove);
    }
  }

  if (options?.printArea) {
    sheet.pageSetup.printArea = options.printArea;
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
