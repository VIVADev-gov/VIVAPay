const CONTRACT_FORM_FIELD_LABELS: Record<string, string> = {
  numeroContrato: "Número de contrato",
  objeto: "Objeto",
  fechaActaInicio: "Fecha acta de inicio",
  fechaFinal: "Fecha final",
  plazoMeses: "Plazo (meses)",
  concepto: "Concepto principal",
  rubro: "Rubro principal",
  cdp: "Certificado de disponibilidad presupuestal (CDP)",
  valorCdp: "Valor certificado de disponibilidad presupuestal (CDP)",
  rpc: "Registro presupuestal del compromiso (RCP)",
  valorRpc: "Valor registro presupuestal del compromiso (RCP)",
  valorInicialContrato: "Valor inicial del contrato",
  numeroDisponibilidad: "Número de disponibilidad",
  numeroCompromiso: "Número de compromiso",
  tieneReembolsables: "¿Tiene reembolsables?",
  rubroRembolsable: "Rubro reembolsable",
  conceptoRembolsable: "Concepto reembolsable",
  rubrosAdicionales: "Rubros adicionales",
  submittedPaymentAccountsCount: "Cuentas enviadas previamente",
  document_CONTRATO: "Contrato (PDF)",
  document_ACTA_INICIO: "Acta de inicio (PDF)",
  document_POLIZA_FIRMADA: "Póliza firmada (PDF)",
  document_CERTIFICADO_APROBACION_POLIZA: "Certificado de aprobación de póliza (PDF)",
  document_RUT: "RUT (PDF)",
  document_CERTIFICACION_BANCARIA: "Certificación bancaria (PDF)",
};

export function getContractFormFieldLabel(fieldKey: string) {
  if (fieldKey.startsWith("rubrosAdicionales.")) {
    const [, indexValue, field] = fieldKey.split(".");
    const index = Number(indexValue);
    if (!Number.isNaN(index)) {
      return field === "rubro"
        ? `Rubro adicional ${index + 1}`
        : `Concepto adicional ${index + 1}`;
    }
  }

  return CONTRACT_FORM_FIELD_LABELS[fieldKey] ?? fieldKey;
}

export function formatContractFormErrors(errors: Record<string, string>) {
  const keys = Object.keys(errors);
  if (keys.length === 0) {
    return "Revisa los datos del contrato antes de continuar.";
  }

  const labels = keys.map((key) => getContractFormFieldLabel(key));
  return `Faltan datos para crear el contrato: ${labels.join(", ")}.`;
}

export const ZOD_FIELD_LABELS: Record<string, string> = {
  ...CONTRACT_FORM_FIELD_LABELS,
};
