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
  byContractId: string | null;
  byContractAccounts: PublicCuentaCobro[];
  isLoadingSummary: boolean;
  isLoadingByContract: boolean;
  summaryError: string | null;
};

export const initialCuentasCobroState: CuentasCobroState = {
  summary: null,
  currentContract: null,
  nextPaymentAccount: null,
  lastPaymentAccount: null,
  completedAllPaymentAccounts: false,
  summaryMessage: null,
  byContractId: null,
  byContractAccounts: [],
  isLoadingSummary: false,
  isLoadingByContract: false,
  summaryError: null,
};
