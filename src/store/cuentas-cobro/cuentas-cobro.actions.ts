import type { StateCreator } from "zustand";
import type {
  ContratoDetailResponse,
  CuentasCobroSummaryResponse,
} from "@/types/contratos";
import {
  initialCuentasCobroState,
  type CuentasCobroState,
} from "./cuentas-cobro.storage";

export type CuentasCobroActions = {
  setSummaryLoading: (loading: boolean) => void;
  setSummaryError: (error: string | null) => void;
  setSummary: (data: CuentasCobroSummaryResponse) => void;
  setByContractLoading: (loading: boolean) => void;
  setByContract: (contractId: string, data: ContratoDetailResponse) => void;
  resetCuentasCobro: () => void;
};

export type CuentasCobroStore = CuentasCobroState & CuentasCobroActions;

export const createCuentasCobroActions: StateCreator<
  CuentasCobroStore,
  [],
  [],
  CuentasCobroActions
> = (set) => ({
  setSummaryLoading: (isLoadingSummary) => set({ isLoadingSummary }),

  setSummaryError: (summaryError) => set({ summaryError }),

  setSummary: (data) =>
    set({
      summary: data,
      currentContract: data.currentContract,
      nextPaymentAccount: data.nextPaymentAccount,
      lastPaymentAccount: data.lastPaymentAccount,
      completedAllPaymentAccounts: data.completedAllPaymentAccounts,
      summaryMessage: data.message,
      summaryError: null,
    }),

  setByContractLoading: (isLoadingByContract) => set({ isLoadingByContract }),

  setByContract: (contractId, data) =>
    set({
      byContractId: contractId,
      byContractAccounts: data.paymentAccounts,
      isLoadingByContract: false,
    }),

  resetCuentasCobro: () => set({ ...initialCuentasCobroState }),
});
