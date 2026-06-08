import { parsePaymentAccountDeclarations } from "@/lib/cuentas-cobro/paymentAccountDeclarations";
import {
  getPaymentDocumentRequirements,
  getPaymentDocumentLabel,
  resolvePaymentPhase,
} from "@/lib/cuentas-cobro/paymentAccountRules";
import {
  parseSeguridadSocialPlantillaMetadata,
  SEGURIDAD_SOCIAL_TIPO,
} from "@/lib/cuentas-cobro/seguridadSocialPlantilla";
import type {
  PaymentAccountDeclarations,
  PublicCuentaCobro,
  PublicCuentaCobroDocumento,
} from "@/types/contratos";

export type PaymentAccountReadinessIssue =
  | "MISSING_ACTIVITIES"
  | "MISSING_SEGURIDAD_SOCIAL"
  | "MISSING_PLANTILLA"
  | "MISSING_DECLARATIONS"
  | "MISSING_CONTRACT_DOCUMENT";

export type PaymentAccountReadinessResult = {
  ready: boolean;
  issues: PaymentAccountReadinessIssue[];
  messages: string[];
  missingContractDocuments: string[];
};

export function validatePaymentAccountReadiness(input: {
  paymentAccount: PublicCuentaCobro;
  paymentAccounts: PublicCuentaCobro[];
  activitiesCount: number;
  accountDocuments: PublicCuentaCobroDocumento[];
  contractDocuments: PublicCuentaCobroDocumento[];
  declarations: PaymentAccountDeclarations | null | undefined;
}): PaymentAccountReadinessResult {
  const issues: PaymentAccountReadinessIssue[] = [];
  const messages: string[] = [];
  const missingContractDocuments: string[] = [];

  const phase = resolvePaymentPhase(input.paymentAccount, input.paymentAccounts);
  const requirements = getPaymentDocumentRequirements(phase);

  if (input.activitiesCount < 1) {
    issues.push("MISSING_ACTIVITIES");
    messages.push("Debes registrar al menos una actividad.");
  }

  if (!parsePaymentAccountDeclarations(input.declarations)) {
    issues.push("MISSING_DECLARATIONS");
    messages.push("Debes completar las declaraciones juradas.");
  }

  const seguridadSocial = input.accountDocuments.find(
    (document) =>
      document.tipoDocumento === SEGURIDAD_SOCIAL_TIPO && document.filePath
  );

  if (!seguridadSocial) {
    issues.push("MISSING_SEGURIDAD_SOCIAL");
    messages.push("Debes subir el soporte de seguridad social.");
  } else if (!parseSeguridadSocialPlantillaMetadata(seguridadSocial.metadata)) {
    issues.push("MISSING_PLANTILLA");
    messages.push(
      "Debes indicar el número de plantilla de pensión, EPS y ARL."
    );
  }

  for (const requirement of requirements) {
    if (requirement.scope !== "contract" || !requirement.required) continue;

    const document = input.contractDocuments.find(
      (item) => item.tipoDocumento === requirement.tipoDocumento && item.filePath
    );

    if (!document) {
      if (!issues.includes("MISSING_CONTRACT_DOCUMENT")) {
        issues.push("MISSING_CONTRACT_DOCUMENT");
      }
      missingContractDocuments.push(requirement.label);
      messages.push(`Falta el documento del contrato: ${requirement.label}.`);
    }
  }

  return {
    ready: issues.length === 0,
    issues,
    messages,
    missingContractDocuments,
  };
}

export function getPaymentAccountReadinessSummary(
  result: PaymentAccountReadinessResult
) {
  if (result.ready) return null;
  return result.messages.join(" ");
}

export function getPaymentPhaseLabel(
  paymentAccount: PublicCuentaCobro,
  paymentAccounts: PublicCuentaCobro[]
) {
  const phase = resolvePaymentPhase(paymentAccount, paymentAccounts);

  switch (phase) {
    case "PRIMERA":
      return "Primera cuenta";
    case "ULTIMA":
      return "Última cuenta";
    case "UNICA":
      return "Cuenta única";
    default:
      return "Cuenta intermedia";
  }
}

export function formatDocumentDisplayName(
  document: PublicCuentaCobroDocumento
) {
  return (
    document.originalName ??
    getPaymentDocumentLabel(document.tipoDocumento) ??
    document.tipoDocumento
  );
}
