export const ACCOUNT_PAYMENT_DOCUMENTS = [
  {
    tipoDocumento: "CARTA_CUENTA_AFC",
    label: "Carta de cuenta AFC",
    helperText: "Opcional en cualquier cuenta de cobro.",
  },
  {
    tipoDocumento: "GBS_FO_40",
    label: "GBS-FO-40 Acta de Recibo Final",
    helperText: "Obligatorio en la última o única cuenta de cobro.",
  },
  {
    tipoDocumento: "GTH_FO_17",
    label: "GTH-FO-17 Paz y Salvo",
    helperText: "Obligatorio en la última o única cuenta de cobro.",
  },
  {
    tipoDocumento: "GBS_FO_05",
    label: "GBS-FO-05 Proveedores de Evaluación",
    helperText: "Obligatorio en la última o única cuenta de cobro.",
  },
] as const;

export type AccountPaymentDocumentType =
  (typeof ACCOUNT_PAYMENT_DOCUMENTS)[number]["tipoDocumento"];

export function getAccountPaymentDocumentLabel(tipoDocumento: string) {
  const match = ACCOUNT_PAYMENT_DOCUMENTS.find(
    (item) => item.tipoDocumento === tipoDocumento
  );
  return match?.label ?? tipoDocumento;
}
