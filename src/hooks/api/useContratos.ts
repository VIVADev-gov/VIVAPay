"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { useContratosStore } from "@/store/contratos/contratos.store";
import type {
  ContratoDetailResponse,
  ContratosResponse,
  CreateContratoBody,
  CreateContratoResponse,
  UpdateContratoBody,
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
  const detailContractId = useContratosStore(
    (s) => s.detail?.contract.id ?? null
  );

  useEffect(() => {
    if (!id) return;
    if (detailContractId !== null && detailContractId !== id) {
      setContratoDetail(null);
      setDetailError(null);
    }
  }, [id, detailContractId, setContratoDetail, setDetailError]);

  return useQuery({
    queryKey: contratosQueryKeys.detail(id),
    enabled: Boolean(id),
    queryFn: async () => {
      const hasCurrentDetail = useContratosStore.getState().detail?.contract.id === id;
      if (!hasCurrentDetail) {
        setDetailLoading(true);
      }
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
        if (!hasCurrentDetail) {
          setContratoDetail(null);
        }
        throw error;
      } finally {
        if (!hasCurrentDetail) {
          setDetailLoading(false);
        }
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
  const applyContratoDetailUpdate = useContratosStore(
    (s) => s.applyContratoDetailUpdate
  );

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<ContratoDetailResponse>>(
        `/api/cuentas-cobro/contrato/${contractId}`
      );
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: (data) => {
      applyContratoDetailUpdate(data);
      queryClient.setQueryData(contratosQueryKeys.detail(contractId), data);
      queryClient.invalidateQueries({ queryKey: contratosQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: cuentasCobroQueryKeys.summary });
    },
  });
}

export function useUpdateContratoMutation(contractId: string) {
  const queryClient = useQueryClient();
  const applyContratoDetailUpdate = useContratosStore(
    (s) => s.applyContratoDetailUpdate
  );

  return useMutation({
    mutationFn: async (body: UpdateContratoBody) => {
      const { data } = await api.patch<ApiResponse<ContratoDetailResponse>>(
        `/api/contratos/${contractId}`,
        body
      );
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: (data) => {
      applyContratoDetailUpdate(data);
      queryClient.setQueryData(contratosQueryKeys.detail(contractId), data);
      queryClient.invalidateQueries({ queryKey: contratosQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: cuentasCobroQueryKeys.summary });
    },
  });
}
