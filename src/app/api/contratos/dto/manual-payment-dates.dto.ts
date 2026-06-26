import { z } from "zod";

export const manualPaymentDateEntrySchema = z.object({
  numero: z.coerce
    .number()
    .int("El número de cuenta debe ser entero")
    .min(1, "El número de cuenta debe ser al menos 1"),
  fechaPago: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha de pago debe ser YYYY-MM-DD"),
});

export const manualPaymentDatesSchema = z
  .array(manualPaymentDateEntrySchema)
  .optional()
  .default([]);

export type ManualPaymentDateEntryDto = z.infer<
  typeof manualPaymentDateEntrySchema
>;

export function parseManualPaymentDatesMap(
  entries: ManualPaymentDateEntryDto[]
): Map<number, Date> {
  const map = new Map<number, Date>();
  for (const entry of entries) {
    const [year, month, day] = entry.fechaPago.split("-").map(Number);
    map.set(entry.numero, new Date(Date.UTC(year, month - 1, day, 12, 0, 0)));
  }
  return map;
}

export function validateManualPaymentDatesForCount(
  count: number,
  entries: ManualPaymentDateEntryDto[]
): string | null {
  if (count <= 0) return null;

  const byNumero = new Map(entries.map((entry) => [entry.numero, entry.fechaPago]));
  for (let numero = 1; numero <= count; numero++) {
    if (!byNumero.get(numero)) {
      return `Indica la fecha de pago de la cuenta ${numero}`;
    }
  }
  return null;
}
