"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { useContratosStore } from "@/store/contratos/contratos.store";
import type {
  ContratoDetailResponse,
  ContratosResponse,
  CreateContratoBody,
  CreateContratoResponse,
} from "@/types/contratos";
import { cuentasCobroQueryKeys } from "./useCuentasCobro";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const contratosQueryKeys = {
  all: ["contratos"] as const,
  detail: (id: string) => ["contratos", id] as const,
};

export function useContratosQuery() {
  const setListLoading = useContratosStore((s) => s.setListLoading);
  const setListError = useContratosStore((s) => s.setListError);
  const setContratosList = useContratosStore((s) => s.setContratosList);

  return useQuery({
    queryKey: contratosQueryKeys.all,
    queryFn: async () => {
      setListLoading(true);
      setListError(null);
      try {
        const { data } = await api.get<ApiResponse<ContratosResponse>>(
          "/api/contratos"
        );
        if (!data.success) throw new Error(data.message);
        setContratosList(data.data);
        return data.data;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Error al cargar contratos";
        setListError(message);
        throw error;
      } finally {
        setListLoading(false);
      }
    },
  });
}

export function useContratoDetailQuery(id: string) {
  const setDetailLoading = useContratosStore((s) => s.setDetailLoading);
  const setDetailError = useContratosStore((s) => s.setDetailError);
  const setContratoDetail = useContratosStore((s) => s.setContratoDetail);

  return useQuery({
    queryKey: contratosQueryKeys.detail(id),
    enabled: Boolean(id),
    queryFn: async () => {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const { data } = await api.get<ApiResponse<ContratoDetailResponse>>(
          `/api/contratos/${id}`
        );
        if (!data.success) throw new Error(data.message);
        setContratoDetail(data.data);
        return data.data;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Error al cargar contrato";
        setDetailError(message);
        setContratoDetail(null);
        throw error;
      } finally {
        setDetailLoading(false);
      }
    },
  });
}

export function useCreateContratoMutation() {
  const queryClient = useQueryClient();
  const closeCreateModal = useContratosStore((s) => s.closeCreateModal);

  return useMutation({
    mutationFn: async (body: CreateContratoBody) => {
      const { data } = await api.post<ApiResponse<CreateContratoResponse>>(
        "/api/contratos",
        body
      );
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => {
      closeCreateModal();
      queryClient.invalidateQueries({ queryKey: contratosQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: cuentasCobroQueryKeys.summary });
    },
  });
}

export function useRegenerateContratoPaymentAccountsMutation(contractId: string) {
  const queryClient = useQueryClient();
  const setContratoDetail = useContratosStore((s) => s.setContratoDetail);

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<ContratoDetailResponse>>(
        `/api/cuentas-cobro/contrato/${contractId}`
      );
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: (data) => {
      setContratoDetail(data);
      queryClient.invalidateQueries({ queryKey: contratosQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: contratosQueryKeys.detail(contractId),
      });
      queryClient.invalidateQueries({ queryKey: cuentasCobroQueryKeys.summary });
    },
  });
}
