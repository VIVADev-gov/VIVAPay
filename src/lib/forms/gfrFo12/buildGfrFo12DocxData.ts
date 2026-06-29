import type { FormPackageContext } from "@/lib/forms/excel/types";
import type { GfrFo12DocumentTypes } from "./gfrFo12Checklist";
import { buildGfrFo12ChecklistRows } from "./gfrFo12Checklist";

export type GfrFo12DocxData = {
  filas: Array<{
    numero: number;
    descripcion: string;
    pago1: string;
    pago2: string;
    pagoUltimo: string;
    pagoUnico: string;
    nota: string;
    entrega: string;
  }>;
  contratistaNombre: string;
  contratistaCedula: string;
  supervisorNombre: string;
  supervisorCedula: string;
  contratistaFirma: string;
  supervisorFirma: string;
};

export function buildGfrFo12DocxData(
  ctx: FormPackageContext,
  uploaded: GfrFo12DocumentTypes,
  signatures: {
    contratistaFirma: string;
    supervisorFirma: string;
  }
): GfrFo12DocxData {
  const filas = buildGfrFo12ChecklistRows(ctx, uploaded).map((row) => ({
    numero: row.numero,
    descripcion: row.descripcion,
    pago1: row.pago1,
    pago2: row.pago2,
    pagoUltimo: row.pagoUltimo,
    pagoUnico: row.pagoUnico,
    nota: row.nota,
    entrega: row.entrega,
  }));

  return {
    filas,
    contratistaNombre: ctx.contractor.name.toUpperCase(),
    contratistaCedula: ctx.contractor.documentId,
    supervisorNombre: ctx.reviewer.name.toUpperCase(),
    supervisorCedula: ctx.reviewer.documentId,
    contratistaFirma: signatures.contratistaFirma,
    supervisorFirma: signatures.supervisorFirma,
  };
}
