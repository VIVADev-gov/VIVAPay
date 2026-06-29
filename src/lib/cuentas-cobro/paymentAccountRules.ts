import { CONTRACT_PAYMENT_DOCUMENTS } from "@/constants/contractDocuments";
import { ACCOUNT_PAYMENT_DOCUMENTS } from "@/constants/paymentAccountDocuments";
import type { PublicCuentaCobro } from "@/types/contratos";

export type PaymentPhase = "PRIMERA" | "INTERMEDIA" | "ULTIMA" | "UNICA";
export type PaymentDocumentScope = "contract" | "account";

export type PaymentDocumentRequirement = {
  tipoDocumento: string;
  label: string;
  helperText: string;
  scope: PaymentDocumentScope;
  required?: boolean;
  requiresPlantilla?: boolean;
  phases: PaymentPhase[];
};

const OPEN_STATUSES = new Set([
  "BORRADOR",
  "PENDIENTE",
  "HABILITADA",
  "PENDIENTE_CONTRATISTA",
]);

export function resolvePaymentPhase(
  paymentAccount: PublicCuentaCobro,
  paymentAccounts: PublicCuentaCobro[]
): PaymentPhase {
  const total = paymentAccounts.length;
  if (total <= 1) return "UNICA";
  if (paymentAccount.numero === 1) return "PRIMERA";
  if (paymentAccount.numero === total) return "ULTIMA";
  return "INTERMEDIA";
}

export function getNextActionablePaymentAccount(
  paymentAccounts: PublicCuentaCobro[]
) {
  return paymentAccounts
    .slice()
    .sort((a, b) => a.numero - b.numero)
    .find((account) => OPEN_STATUSES.has(account.estado));
}

export function isPaymentAccountActionable(
  paymentAccount: PublicCuentaCobro,
  paymentAccounts: PublicCuentaCobro[]
) {
  const next = getNextActionablePaymentAccount(paymentAccounts);
  return next?.id === paymentAccount.id;
}

// Según GFR-FO-12 los documentos de contrato (RUT, contrato, acta de inicio,
// póliza, certificado de aprobación de póliza y certificación bancaria) solo se
// exigen en la primera cuenta y en la cuenta única; en la última no aplican.
const CONTRACT_SCOPE_PHASES: PaymentPhase[] = ["PRIMERA", "UNICA"];

const CONTRACT_SCOPE_REQUIREMENTS: PaymentDocumentRequirement[] =
  CONTRACT_PAYMENT_DOCUMENTS.map((document) => ({
    tipoDocumento: document.tipoDocumento,
    label: document.label,
    helperText: document.helperText,
    scope: "contract" as const,
    required: true,
    phases: CONTRACT_SCOPE_PHASES,
  }));

const ALL_PHASES: PaymentPhase[] = ["PRIMERA", "INTERMEDIA", "ULTIMA", "UNICA"];
const CLOSING_PHASES: PaymentPhase[] = ["ULTIMA", "UNICA"];

const ACCOUNT_SCOPE_REQUIREMENTS: PaymentDocumentRequirement[] = [
  {
    tipoDocumento: ACCOUNT_PAYMENT_DOCUMENTS[0].tipoDocumento,
    label: ACCOUNT_PAYMENT_DOCUMENTS[0].label,
    helperText: ACCOUNT_PAYMENT_DOCUMENTS[0].helperText,
    scope: "account",
    required: false,
    phases: ALL_PHASES,
  },
  ...ACCOUNT_PAYMENT_DOCUMENTS.slice(1).map((document) => ({
    tipoDocumento: document.tipoDocumento,
    label: document.label,
    helperText: document.helperText,
    scope: "account" as const,
    required: true,
    phases: CLOSING_PHASES,
  })),
];

export const PAYMENT_DOCUMENT_REQUIREMENTS: PaymentDocumentRequirement[] = [
  ...CONTRACT_SCOPE_REQUIREMENTS,
  {
    tipoDocumento: "SEGURIDAD_SOCIAL",
    label: "Soporte de pago de seguridad social",
    helperText:
      "Soporte del periodo. Indica el número de plantilla de pensión, EPS y ARL.",
    scope: "account",
    required: true,
    requiresPlantilla: true,
    phases: ALL_PHASES,
  },
  ...ACCOUNT_SCOPE_REQUIREMENTS,
];

export function getPaymentDocumentRequirements(phase: PaymentPhase) {
  return PAYMENT_DOCUMENT_REQUIREMENTS.filter((item) =>
    item.phases.includes(phase)
  );
}

export function getPaymentDocumentLabel(tipoDocumento: string) {
  const match = PAYMENT_DOCUMENT_REQUIREMENTS.find(
    (item) => item.tipoDocumento === tipoDocumento
  );
  return match?.label ?? tipoDocumento;
}

export function includesGfrFo11(phase: PaymentPhase) {
  return phase === "PRIMERA" || phase === "UNICA";
}
