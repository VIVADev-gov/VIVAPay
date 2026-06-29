import "server-only";

import type ExcelJS from "exceljs";

type ParsedAddress = { col: string; row: number };

function parseAddress(address: string): ParsedAddress {
  const match = address.match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error(`Dirección inválida en celda combinada: ${address}`);
  }
  return { col: match[1], row: Number(match[2]) };
}

function shiftRow(row: number, spliceStart: number, delta: number): number {
  return row >= spliceStart ? row + delta : row;
}

/**
 * Inserta o elimina filas conservando los rangos de celdas combinadas.
 *
 * ExcelJS `spliceRows` mueve valores y estilos, pero NO ajusta los merges:
 * los rangos quedan apuntando a las filas originales y, al desplazarse el
 * contenido, los textos largos centrados pierden su combinación y se recortan
 * al exportar a PDF. Esta función reaplica los merges con el desfase correcto.
 */
export function spliceRowsWithMerges(
  sheet: ExcelJS.Worksheet,
  start: number,
  deleteCount: number,
  ...inserts: unknown[][]
): void {
  const delta = inserts.length - deleteCount;
  const merges: string[] = [
    ...(((sheet.model as { merges?: string[] }).merges ?? []) as string[]),
  ];

  for (const range of merges) {
    sheet.unMergeCells(range);
  }

  sheet.spliceRows(start, deleteCount, ...(inserts as unknown[][]));

  if (delta === 0) {
    for (const range of merges) {
      sheet.mergeCells(range);
    }
    return;
  }

  const removedStart = start;
  const removedEnd = start + deleteCount - 1;

  for (const range of merges) {
    const [topLeftRaw, bottomRightRaw] = range.split(":");
    const topLeft = parseAddress(topLeftRaw);
    const bottomRight = parseAddress(bottomRightRaw ?? topLeftRaw);

    if (
      deleteCount > 0 &&
      topLeft.row >= removedStart &&
      bottomRight.row <= removedEnd
    ) {
      continue;
    }

    const newTopRow = shiftRow(topLeft.row, start, delta);
    const newBottomRow = shiftRow(bottomRight.row, start, delta);

    if (newBottomRow < newTopRow) {
      continue;
    }

    sheet.mergeCells(
      `${topLeft.col}${newTopRow}:${bottomRight.col}${newBottomRow}`
    );
  }
}
