"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { useCuentasCobroStore } from "@/store/cuentas-cobro/cuentas-cobro.store";
import type {
  ContratoDetailResponse,
  CuentasCobroSummaryResponse,
} from "@/types/contratos";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const cuentasCobroQueryKeys = {
  summary: ["cuentas-cobro", "summary"] as const,
  byContract: (contractId: string) =>
    ["cuentas-cobro", "contract", contractId] as const,
};

export function useCuentasCobroSummaryQuery() {
  const setSummaryLoading = useCuentasCobroStore((s) => s.setSummaryLoading);
  const setSummaryError = useCuentasCobroStore((s) => s.setSummaryError);
  const setSummary = useCuentasCobroStore((s) => s.setSummary);

  return useQuery({
    queryKey: cuentasCobroQueryKeys.summary,
    queryFn: async () => {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        const { data } = await api.get<ApiResponse<CuentasCobroSummaryResponse>>(
          "/api/cuentas-cobro"
        );
        if (!data.success) throw new Error(data.message);
        setSummary(data.data);
        return data.data;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Error al cargar cuentas de cobro";
        setSummaryError(message);
        throw error;
      } finally {
        setSummaryLoading(false);
      }
    },
  });
}

export function useCuentasCobroByContractQuery(contractId: string) {
  const setByContractLoading = useCuentasCobroStore((s) => s.setByContractLoading);
  const setByContract = useCuentasCobroStore((s) => s.setByContract);

  return useQuery({
    queryKey: cuentasCobroQueryKeys.byContract(contractId),
    enabled: Boolean(contractId),
    queryFn: async () => {
      setByContractLoading(true);
      try {
        const { data } = await api.get<ApiResponse<ContratoDetailResponse>>(
          `/api/cuentas-cobro/contrato/${contractId}`
        );
        if (!data.success) throw new Error(data.message);
        setByContract(contractId, data.data);
        return data.data;
      } finally {
        setByContractLoading(false);
      }
    },
  });
}
