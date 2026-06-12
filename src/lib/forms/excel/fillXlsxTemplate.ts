import "server-only";

import ExcelJS from "exceljs";
import path from "path";
import type { CellValues } from "./types";

export type FillXlsxImageExtension = "png" | "jpeg" | "gif";

export type FillXlsxImageAnchor = {
  absolutePath: string;
  extension: FillXlsxImageExtension;
  tl: { col: number; row: number };
  br: { col: number; row: number };
};

export type FillXlsxPageSetup = {
  fitToPage?: boolean;
  fitToWidth?: number;
  fitToHeight?: number;
  orientation?: "portrait" | "landscape";
};

export type FillXlsxOptions = {
  trimRowsAfter?: number;
  printArea?: string;
  pageSetup?: FillXlsxPageSetup;
  images?: FillXlsxImageAnchor[];
  removeOtherSheets?: boolean;
};

function removeWorksheetsExcept(
  workbook: ExcelJS.Workbook,
  keepSheet: ExcelJS.Worksheet
) {
  for (const worksheet of [...workbook.worksheets]) {
    if (worksheet.id !== keepSheet.id) {
      workbook.removeWorksheet(worksheet.id);
    }
  }
}

function resolveWorksheet(workbook: ExcelJS.Workbook, sheetName: string) {
  const exact = workbook.getWorksheet(sheetName);
  if (exact) return exact;

  const normalized = sheetName.trim().toLowerCase();
  return workbook.worksheets.find(
    (sheet) => sheet.name.trim().toLowerCase() === normalized
  );
}

function applyPageSetup(sheet: ExcelJS.Worksheet, pageSetup: FillXlsxPageSetup) {
  if (pageSetup.fitToPage != null) {
    sheet.pageSetup.fitToPage = pageSetup.fitToPage;
  }
  if (pageSetup.fitToWidth != null) {
    sheet.pageSetup.fitToWidth = pageSetup.fitToWidth;
  }
  if (pageSetup.fitToHeight != null) {
    sheet.pageSetup.fitToHeight = pageSetup.fitToHeight;
  }
  if (pageSetup.orientation) {
    sheet.pageSetup.orientation = pageSetup.orientation;
  }
  if (pageSetup.fitToPage) {
    sheet.pageSetup.scale = 100;
  }
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

  if (options?.removeOtherSheets) {
    removeWorksheetsExcept(workbook, sheet);
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

  if (options?.pageSetup) {
    applyPageSetup(sheet, options.pageSetup);
  }

  for (const image of options?.images ?? []) {
    const imageId = workbook.addImage({
      filename: image.absolutePath,
      extension: image.extension,
    });
    sheet.addImage(imageId, {
      tl: image.tl,
      br: image.br,
      editAs: "oneCell",
    });
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
