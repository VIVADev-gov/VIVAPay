import "server-only";

import type ExcelJS from "exceljs";

export type ExpandGfrFo17HistorialOptions = {
  startRow: number;
  baseRows: number;
  targetRows: number;
};

function copyRowStyle(
  sheet: ExcelJS.Worksheet,
  fromRow: number,
  toRow: number
) {
  const source = sheet.getRow(fromRow);
  const target = sheet.getRow(toRow);
  target.height = source.height;

  source.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const targetCell = target.getCell(colNumber);
    targetCell.style = { ...cell.style };
    if (cell.numFmt) {
      targetCell.numFmt = cell.numFmt;
    }
  });
}

function setHistorialRowFormulas(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  endRow: number
) {
  for (let row = startRow; row <= endRow; row++) {
    sheet.getCell(`H${row}`).value = { formula: `F${row}+G${row}` };
  }
}

export function expandGfrFo17HistorialRows(
  sheet: ExcelJS.Worksheet,
  options: ExpandGfrFo17HistorialOptions
) {
  const { startRow, baseRows, targetRows } = options;
  const rowsToInsert = Math.max(0, targetRows - baseRows);

  if (rowsToInsert > 0) {
    const templateRow = startRow + baseRows - 1;
    const totalRowBefore = startRow + baseRows;
    const emptyRows = Array.from({ length: rowsToInsert }, () => []);
    sheet.spliceRows(totalRowBefore, 0, ...emptyRows);

    for (let index = 0; index < rowsToInsert; index++) {
      const targetRow = totalRowBefore + index;
      copyRowStyle(sheet, templateRow, targetRow);
    }
  }

  const historialEndRow = startRow + targetRows - 1;
  setHistorialRowFormulas(sheet, startRow, historialEndRow);

  const totalRow = historialEndRow + 1;
  const valorRow = totalRow + 1;
  const saldoRow = totalRow + 2;

  sheet.getCell(`F${totalRow}`).value = {
    formula: `SUM(F${startRow}:F${historialEndRow})`,
  };
  sheet.getCell(`G${totalRow}`).value = {
    formula: `SUM(G${startRow}:G${historialEndRow})`,
  };
  sheet.getCell(`H${totalRow}`).value = {
    formula: `SUM(H${startRow}:H${historialEndRow})`,
  };

  sheet.getCell(`F${saldoRow}`).value = {
    formula: `F${valorRow}-F${totalRow}`,
  };
  sheet.getCell(`G${saldoRow}`).value = {
    formula: `G${valorRow}-G${totalRow}`,
  };
  sheet.getCell(`H${saldoRow}`).value = {
    formula: `H${valorRow}-H${totalRow}`,
  };
}
