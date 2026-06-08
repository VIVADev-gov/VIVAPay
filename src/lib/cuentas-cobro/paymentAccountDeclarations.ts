export type PaymentAccountDeclarations = {
  contratoMultiplesTrabajadores: boolean;
  rutActualizado: boolean;
};

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
