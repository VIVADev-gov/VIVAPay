import type { StateCreator } from "zustand";
import type { CuentasCobroSummaryResponse } from "@/types/contratos";
import {
  initialCuentasCobroState,
  type CuentasCobroState,
} from "./cuentas-cobro.storage";

export type CuentasCobroActions = {
  setSummaryLoading: (loading: boolean) => void;
  setSummaryError: (error: string | null) => void;
  setSummary: (data: CuentasCobroSummaryResponse) => void;
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

  resetCuentasCobro: () => set({ ...initialCuentasCobroState }),
});
