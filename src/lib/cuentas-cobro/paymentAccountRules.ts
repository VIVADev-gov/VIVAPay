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

const OPEN_STATUSES = new Set(["BORRADOR", "PENDIENTE", "HABILITADA"]);

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

export const PAYMENT_DOCUMENT_REQUIREMENTS: PaymentDocumentRequirement[] = [
  {
    tipoDocumento: "SEGURIDAD_SOCIAL",
    label: "Soporte de pago de seguridad social",
    helperText:
      "Soporte del periodo. Indica el número de plantilla de pensión, EPS y ARL.",
    scope: "account",
    required: true,
    requiresPlantilla: true,
    phases: ["PRIMERA", "INTERMEDIA", "ULTIMA", "UNICA"],
  },
];

export function getPaymentDocumentRequirements(phase: PaymentPhase) {
  return PAYMENT_DOCUMENT_REQUIREMENTS.filter((item) =>
    item.phases.includes(phase)
  );
}
