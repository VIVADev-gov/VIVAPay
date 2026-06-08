import type { PaymentAccountDeclarations } from "@/lib/cuentas-cobro/paymentAccountDeclarations";
import type {
  CuentasCobroSummaryResponse,
  PublicContrato,
  PublicCuentaCobro,
} from "@/types/contratos";

export type CuentasCobroState = {
  summary: CuentasCobroSummaryResponse | null;
  currentContract: PublicContrato | null;
  nextPaymentAccount: PublicCuentaCobro | null;
  lastPaymentAccount: PublicCuentaCobro | null;
  completedAllPaymentAccounts: boolean;
  summaryMessage: string | null;
  isLoadingSummary: boolean;
  summaryError: string | null;
  declarationsByAccount: Record<string, PaymentAccountDeclarations>;
};

export const initialCuentasCobroState: CuentasCobroState = {
  summary: null,
  currentContract: null,
  nextPaymentAccount: null,
  lastPaymentAccount: null,
  completedAllPaymentAccounts: false,
  summaryMessage: null,
  isLoadingSummary: false,
  summaryError: null,
  declarationsByAccount: {},
};
