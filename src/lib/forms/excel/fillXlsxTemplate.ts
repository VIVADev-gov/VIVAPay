import "server-only";

import ExcelJS from "exceljs";
import path from "path";
import type { CellValues } from "./types";
import {
  expandGfrFo17HistorialRows,
  type ExpandGfrFo17HistorialOptions,
} from "./expandGfrFo17Historial";
import type { CellFormats } from "./build/formExcelHelpers";

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
  expandGfrFo17Historial?: ExpandGfrFo17HistorialOptions;
  cellFormats?: CellFormats;
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
  const sheetDimensions = sheet.dimensions as
    | (ExcelJS.Range & { model?: { top: number; left: number; bottom: number; right: number } })
    | undefined;
  if (sheetDimensions?.model) {
    sheetDimensions.model = {
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
    const current = sheet.pageSetup.margins ?? {
      left: 0.7,
      right: 0.7,
      top: 0.75,
      bottom: 0.75,
      header: 0.3,
      footer: 0.3,
    };
    sheet.pageSetup.margins = {
      left: pageSetup.margins.left ?? current.left,
      right: pageSetup.margins.right ?? current.right,
      top: pageSetup.margins.top ?? current.top,
      bottom: pageSetup.margins.bottom ?? current.bottom,
      header: pageSetup.margins.header ?? current.header,
      footer: pageSetup.margins.footer ?? current.footer,
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

  if (options?.expandGfrFo17Historial) {
    expandGfrFo17HistorialRows(sheet, options.expandGfrFo17Historial);
  }

  for (const [cellRef, value] of Object.entries(values)) {
    if (value === undefined || value === null) continue;
    const cell = sheet.getCell(cellRef);
    cell.value = value;
    const numFmt = options?.cellFormats?.[cellRef];
    if (numFmt) {
      cell.numFmt = numFmt;
    }
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
    const editAs = image.editAs ?? (image.br ? "twoCell" : "oneCell");
    if (image.ext) {
      sheet.addImage(
        imageId,
        {
          tl: image.tl,
          ext: image.ext,
          editAs,
        } as unknown as ExcelJS.ImagePosition
      );
    } else if (image.br) {
      sheet.addImage(
        imageId,
        {
          tl: image.tl,
          br: image.br,
          editAs,
        } as unknown as ExcelJS.ImageRange
      );
    }
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
