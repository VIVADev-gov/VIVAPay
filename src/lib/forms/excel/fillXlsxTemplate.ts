import "server-only";

import ExcelJS from "exceljs";
import path from "path";
import type { CellValues } from "./types";

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
  values: CellValues
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

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
