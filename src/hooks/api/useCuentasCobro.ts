"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { useCuentasCobroStore } from "@/store/cuentas-cobro/cuentas-cobro.store";
import type {
  CuentaCobroAccountDocumentsResponse,
  CuentaCobroContractDocumentsResponse,
  ContratoDetailResponse,
  CuentasCobroSummaryResponse,
  PublicCuentaCobroDocumento,
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
  documentsByContract: (contractId: string) =>
    ["cuentas-cobro", "contract", contractId, "documents"] as const,
  documentsByAccount: (contractId: string, numeroCuenta: number) =>
    ["cuentas-cobro", "contract", contractId, "account", numeroCuenta, "documents"] as const,
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

export function useCuentaCobroDocumentsQuery(
  contractId: string,
  numeroCuenta: number
) {
  return useQuery({
    queryKey: cuentasCobroQueryKeys.documentsByAccount(contractId, numeroCuenta),
    enabled: Boolean(contractId) && Number.isInteger(numeroCuenta),
    queryFn: async () => {
      const { data } = await api.get<
        ApiResponse<CuentaCobroAccountDocumentsResponse>
      >(
        `/api/cuentas-cobro/contrato/${contractId}/cuentas/${numeroCuenta}/documentos`
      );
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
  });
}

export function useContratoDocumentsQuery(contractId: string) {
  return useQuery({
    queryKey: cuentasCobroQueryKeys.documentsByContract(contractId),
    enabled: Boolean(contractId),
    queryFn: async () => {
      const { data } = await api.get<
        ApiResponse<CuentaCobroContractDocumentsResponse>
      >(`/api/cuentas-cobro/contrato/${contractId}/documentos`);
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
  });
}

export function useUploadContratoDocumentMutation(contractId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      tipoDocumento,
      required = false,
    }: {
      file: File;
      tipoDocumento: string;
      required?: boolean;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tipoDocumento", tipoDocumento);
      formData.append("required", String(required));

      const { data } = await api.post<
        ApiResponse<{ document: PublicCuentaCobroDocumento }>
      >(`/api/cuentas-cobro/contrato/${contractId}/documentos`, formData);
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: cuentasCobroQueryKeys.documentsByContract(contractId),
      });
    },
  });
}

export function useUploadCuentaCobroDocumentMutation(
  contractId: string,
  numeroCuenta: number
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      tipoDocumento,
      required = false,
    }: {
      file: File;
      tipoDocumento: string;
      required?: boolean;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tipoDocumento", tipoDocumento);
      formData.append("required", String(required));

      const { data } = await api.post<
        ApiResponse<{ document: PublicCuentaCobroDocumento }>
      >(
        `/api/cuentas-cobro/contrato/${contractId}/cuentas/${numeroCuenta}/documentos`,
        formData
      );
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: cuentasCobroQueryKeys.documentsByAccount(
          contractId,
          numeroCuenta
        ),
      });
    },
  });
}
