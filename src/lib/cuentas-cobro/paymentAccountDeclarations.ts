import type { PaymentAccountDeclarations } from "@/types/contratos";

export type { PaymentAccountDeclarations };

export function paymentAccountStoreKey(contractId: string, numeroCuenta: number) {
  return `${contractId}:${numeroCuenta}`;
}

export const defaultPaymentAccountDeclarations: PaymentAccountDeclarations = {
  contratoMultiplesTrabajadores: false,
  rutActualizado: true,
};

export function formatDeclarationsSummary(
  declarations: PaymentAccountDeclarations
) {
  return `Retención art. 383: ${declarations.contratoMultiplesTrabajadores ? "Sí" : "No"} · RUT actualizado: ${declarations.rutActualizado ? "Sí" : "No"}`;
}

export function parsePaymentAccountDeclarations(
  value: unknown
): PaymentAccountDeclarations | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  if (
    typeof record.contratoMultiplesTrabajadores !== "boolean" ||
    typeof record.rutActualizado !== "boolean"
  ) {
    return null;
  }

  return {
    contratoMultiplesTrabajadores: record.contratoMultiplesTrabajadores,
    rutActualizado: record.rutActualizado,
  };
}
