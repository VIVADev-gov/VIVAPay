import type { StateCreator } from "zustand";
import type { PaymentAccountDeclarations } from "@/lib/cuentas-cobro/paymentAccountDeclarations";
import { paymentAccountStoreKey } from "@/lib/cuentas-cobro/paymentAccountDeclarations";
import type { CuentasCobroSummaryResponse } from "@/types/contratos";
import {
  initialCuentasCobroState,
  type CuentasCobroState,
} from "./cuentas-cobro.storage";

export type CuentasCobroActions = {
  setSummaryLoading: (loading: boolean) => void;
  setSummaryError: (error: string | null) => void;
  setSummary: (data: CuentasCobroSummaryResponse) => void;
  setPaymentAccountDeclarations: (
    contractId: string,
    numeroCuenta: number,
    declarations: PaymentAccountDeclarations
  ) => void;
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

  setPaymentAccountDeclarations: (contractId, numeroCuenta, declarations) =>
    set((state) => ({
      declarationsByAccount: {
        ...state.declarationsByAccount,
        [paymentAccountStoreKey(contractId, numeroCuenta)]: declarations,
      },
    })),

  resetCuentasCobro: () => set({ ...initialCuentasCobroState }),
});
