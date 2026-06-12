import "server-only";

import ExcelJS from "exceljs";
import path from "path";
import type { CellValues } from "./types";

export type FillXlsxImageExtension = "png" | "jpeg" | "gif";

export type FillXlsxImageEditAs = "oneCell" | "absolute" | "twoCell";

export type FillXlsxImageAnchor = {
  absolutePath: string;
  extension: FillXlsxImageExtension;
  tl: { col: number; row: number };
  br?: { col: number; row: number };
  ext?: { width: number; height: number };
  editAs?: FillXlsxImageEditAs;
};

export type FillXlsxPageMargins = {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  header?: number;
  footer?: number;
};

export type FillXlsxPageSetup = {
  fitToPage?: boolean;
  fitToWidth?: number;
  fitToHeight?: number;
  orientation?: "portrait" | "landscape";
  scale?: number;
  horizontalCentered?: boolean;
  verticalCentered?: boolean;
  margins?: FillXlsxPageMargins;
};

export type FillXlsxOptions = {
  trimRowsAfter?: number;
  printArea?: string;
  pageSetup?: FillXlsxPageSetup;
  images?: FillXlsxImageAnchor[];
  removeOtherSheets?: boolean;
  clearColumnsAfter?: string;
  resetDimensions?: { lastRow: number; lastCol: number };
};

function columnLetterToNumber(letter: string): number {
  const normalized = letter.trim().toUpperCase();
  let column = 0;
  for (let index = 0; index < normalized.length; index++) {
    column = column * 26 + (normalized.charCodeAt(index) - 64);
  }
  return column;
}

function clearColumnsAfterLetter(
  sheet: ExcelJS.Worksheet,
  afterColumn: string,
  lastRow: number
) {
  const startColumn = columnLetterToNumber(afterColumn) + 1;
  const maxColumn = Math.max(sheet.columnCount, 80);
  for (let rowNumber = 1; rowNumber <= lastRow; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    for (let columnNumber = startColumn; columnNumber <= maxColumn; columnNumber++) {
      row.getCell(columnNumber).value = null;
    }
  }
}

function resetSheetDimensions(
  sheet: ExcelJS.Worksheet,
  dimensions: { lastRow: number; lastCol: number }
) {
  if (sheet.dimensions) {
    sheet.dimensions.model = {
      top: 1,
      left: 1,
      bottom: dimensions.lastRow,
      right: dimensions.lastCol,
    };
  }
}

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
  if (pageSetup.scale != null) {
    sheet.pageSetup.scale = pageSetup.scale;
  } else if (pageSetup.fitToPage) {
    sheet.pageSetup.scale = 100;
  }
  if (pageSetup.horizontalCentered != null) {
    sheet.pageSetup.horizontalCentered = pageSetup.horizontalCentered;
  }
  if (pageSetup.verticalCentered != null) {
    sheet.pageSetup.verticalCentered = pageSetup.verticalCentered;
  }
  if (pageSetup.margins) {
    sheet.pageSetup.margins = {
      ...sheet.pageSetup.margins,
      ...pageSetup.margins,
    };
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

  if (options?.clearColumnsAfter) {
    const lastRow = options.trimRowsAfter ?? sheet.rowCount;
    clearColumnsAfterLetter(sheet, options.clearColumnsAfter, lastRow);
  }

  if (options?.resetDimensions) {
    resetSheetDimensions(sheet, options.resetDimensions);
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
    const anchor: {
      tl: { col: number; row: number };
      br?: { col: number; row: number };
      ext?: { width: number; height: number };
      editAs?: FillXlsxImageEditAs;
    } = {
      tl: image.tl,
      editAs: image.editAs ?? "oneCell",
    };
    if (image.ext) {
      anchor.ext = image.ext;
    } else if (image.br) {
      anchor.br = image.br;
    }
    sheet.addImage(imageId, anchor);
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
