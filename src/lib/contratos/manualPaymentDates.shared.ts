import type { ManualPaymentDateEntry } from "@/types/contratos";

export function buildManualPaymentDatesPayload(
  submittedCount: number,
  datesByNumero: Record<number, string | undefined>
): ManualPaymentDateEntry[] {
  const entries: ManualPaymentDateEntry[] = [];
  for (let numero = 1; numero <= submittedCount; numero++) {
    const fechaPago = datesByNumero[numero]?.trim();
    if (fechaPago) {
      entries.push({ numero, fechaPago });
    }
  }
  return entries;
}

export function validateManualPaymentDatesClient(
  submittedCount: number,
  datesByNumero: Record<number, string | undefined>
): string | null {
  if (submittedCount <= 0) return null;
  for (let numero = 1; numero <= submittedCount; numero++) {
    if (!datesByNumero[numero]?.trim()) {
      return `Indica cuándo te pagaron la cuenta ${numero}`;
    }
  }
  return null;
}

export function syncManualPaymentDatesForCount(
  submittedCount: number,
  datesByNumero: Record<number, string | undefined>
): Record<number, string | undefined> {
  const next: Record<number, string | undefined> = {};
  for (let numero = 1; numero <= submittedCount; numero++) {
    next[numero] = datesByNumero[numero];
  }
  return next;
}
