export const CONTRACT_PAYMENT_DOCUMENTS = [
  {
    tipoDocumento: "CONTRATO",
    label: "Contrato",
    helperText: "Documento reutilizable del contrato.",
  },
  {
    tipoDocumento: "ACTA_INICIO",
    label: "Acta de inicio",
    helperText: "Documento base reutilizable del contrato.",
  },
  {
    tipoDocumento: "POLIZA_FIRMADA",
    label: "Póliza firmada",
    helperText: "Reutilizable; subir nueva si hubo prórroga o adición.",
  },
  {
    tipoDocumento: "CERTIFICADO_APROBACION_POLIZA",
    label: "Certificado de aprobación de póliza",
    helperText: "Documento reutilizable del contrato.",
  },
  {
    tipoDocumento: "RUT",
    label: "RUT",
    helperText: "Documento reutilizable del contrato. Debe estar actualizado.",
  },
  {
    tipoDocumento: "CERTIFICACION_BANCARIA",
    label: "Certificación bancaria",
    helperText:
      "Documento reutilizable; reemplazar si cambia la cuenta bancaria.",
  },
] as const;

export type ContractPaymentDocumentType =
  (typeof CONTRACT_PAYMENT_DOCUMENTS)[number]["tipoDocumento"];

export function getContractDocumentLabel(tipoDocumento: string) {
  const match = CONTRACT_PAYMENT_DOCUMENTS.find(
    (item) => item.tipoDocumento === tipoDocumento
  );
  return match?.label ?? tipoDocumento;
}
