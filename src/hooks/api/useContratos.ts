"use client";

import { useEffect } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { useAuthStore } from "@/store/auth/auth.store";
import { useContratosStore } from "@/store/contratos/contratos.store";
import type {
  ContratoDetailResponse,
  ContratosResponse,
  CreateContratoBody,
  CreateContratoResponse,
  PublicContrato,
  UpdateContratoBody,
  UpdateManualRegularizationBody,
} from "@/types/contratos";
import { cuentasCobroQueryKeys } from "./useCuentasCobro";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const contratosQueryKeys = {
  root: ["contratos"] as const,
  list: (userId: string) => ["contratos", "list", userId] as const,
  detail: (userId: string, id: string) =>
    ["contratos", "detail", userId, id] as const,
};

export type UseContratosQueryResult = UseQueryResult<ContratosResponse> & {
  isListLoading: boolean;
  contracts: PublicContrato[];
  currentContract: PublicContrato | null;
  lastContract: PublicContrato | null;
  listError: string | null;
};

function resolveListLoading(
  enabled: boolean,
  isPending: boolean,
  isFetching: boolean,
  hasData: boolean
) {
  if (!enabled) return true;
  return isPending || (isFetching && !hasData);
}

export function useContratosQuery(): UseContratosQueryResult {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const setListLoading = useContratosStore((s) => s.setListLoading);
  const setListError = useContratosStore((s) => s.setListError);
  const setContratosList = useContratosStore((s) => s.setContratosList);
  const storeContracts = useContratosStore((s) => s.contracts);
  const storeCurrentContract = useContratosStore((s) => s.currentContract);
  const storeLastContract = useContratosStore((s) => s.lastContract);
  const storeListError = useContratosStore((s) => s.listError);

  const enabled = isHydrated && Boolean(userId);

  const query = useQuery({
    queryKey: contratosQueryKeys.list(userId ?? ""),
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ContratosResponse>>(
        "/api/contratos"
      );
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
  });

  const isListLoading = resolveListLoading(
    enabled,
    query.isPending,
    query.isFetching,
    query.data !== undefined
  );

  useEffect(() => {
    setListLoading(isListLoading);
  }, [isListLoading, setListLoading]);

  useEffect(() => {
    if (query.data) {
      setContratosList(query.data);
    }
  }, [query.data, setContratosList]);

  useEffect(() => {
    if (query.error) {
      const message =
        query.error instanceof Error
          ? query.error.message
          : "Error al cargar contratos";
      setListError(message);
      return;
    }
    if (!query.isPending) {
      setListError(null);
    }
  }, [query.error, query.isPending, setListError]);

  const contracts = query.data?.contracts ?? storeContracts;
  const currentContract =
    query.data?.currentContract ?? storeCurrentContract;
  const lastContract = query.data?.lastContract ?? storeLastContract;
  const listError =
    query.error instanceof Error
      ? query.error.message
      : query.error
        ? "Error al cargar contratos"
        : storeListError;

  return {
    ...query,
    isListLoading,
    contracts,
    currentContract,
    lastContract,
    listError,
  };
}

export function useContratoDetailQuery(id: string) {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const isHydrated = useAuthStore((s) => s.isHydrated);
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

  const enabled = isHydrated && Boolean(userId) && Boolean(id);

  const query = useQuery({
    queryKey: contratosQueryKeys.detail(userId ?? "", id),
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const hasCurrentDetail =
        useContratosStore.getState().detail?.contract.id === id;
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

  return query;
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
      queryClient.invalidateQueries({ queryKey: contratosQueryKeys.root });
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
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        queryClient.setQueryData(
          contratosQueryKeys.detail(userId, contractId),
          data
        );
      }
      queryClient.invalidateQueries({ queryKey: contratosQueryKeys.root });
      queryClient.invalidateQueries({ queryKey: cuentasCobroQueryKeys.summary });
    },
  });
}

export function useUpdateManualRegularizationMutation(contractId: string) {
  const queryClient = useQueryClient();
  const applyContratoDetailUpdate = useContratosStore(
    (s) => s.applyContratoDetailUpdate
  );

  return useMutation({
    mutationFn: async (body: UpdateManualRegularizationBody) => {
      const { data } = await api.patch<ApiResponse<ContratoDetailResponse>>(
        `/api/contratos/${contractId}/regularizacion-manual`,
        body
      );
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: (data) => {
      applyContratoDetailUpdate(data);
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        queryClient.setQueryData(
          contratosQueryKeys.detail(userId, contractId),
          data
        );
      }
      queryClient.invalidateQueries({ queryKey: contratosQueryKeys.root });
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
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        queryClient.setQueryData(
          contratosQueryKeys.detail(userId, contractId),
          data
        );
      }
      queryClient.invalidateQueries({ queryKey: contratosQueryKeys.root });
      queryClient.invalidateQueries({ queryKey: cuentasCobroQueryKeys.summary });
    },
  });
}
