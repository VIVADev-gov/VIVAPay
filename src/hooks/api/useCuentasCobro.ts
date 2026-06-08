"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { useCuentasCobroStore } from "@/store/cuentas-cobro/cuentas-cobro.store";
import type { CuentaCobroWorkflowAction } from "@/constants/cuentaCobroWorkflow";
import type {
  CuentaCobroAccountDocumentsResponse,
  CuentaCobroActivitiesResponse,
  CuentaCobroContractDocumentsResponse,
  CuentaCobroDeclarationsResponse,
  CuentasCobroSummaryResponse,
  PaymentAccountDeclarations,
  PaymentAccountReviewDetailResponse,
  PaymentAccountReviewListResponse,
  PublicCuentaCobro,
  PublicCuentaCobroActividadItem,
  PublicCuentaCobroDocumento,
  SeguridadSocialPlantillaMetadata,
} from "@/types/contratos";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const cuentasCobroQueryKeys = {
  summary: ["cuentas-cobro", "summary"] as const,
  documentsByContract: (contractId: string) =>
    ["cuentas-cobro", "contract", contractId, "documents"] as const,
  documentsByAccount: (contractId: string, numeroCuenta: number) =>
    ["cuentas-cobro", "contract", contractId, "account", numeroCuenta, "documents"] as const,
  activitiesByAccount: (contractId: string, numeroCuenta: number) =>
    ["cuentas-cobro", "contract", contractId, "account", numeroCuenta, "activities"] as const,
  declarationsByAccount: (contractId: string, numeroCuenta: number) =>
    ["cuentas-cobro", "contract", contractId, "account", numeroCuenta, "declarations"] as const,
  reviewList: ["cuentas-cobro", "revision"] as const,
  reviewDetail: (contractId: string, numeroCuenta: number) =>
    ["cuentas-cobro", "revision", contractId, numeroCuenta] as const,
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

export function useCuentaCobroDeclarationsQuery(
  contractId: string,
  numeroCuenta: number
) {
  const setPaymentAccountDeclarations = useCuentasCobroStore(
    (s) => s.setPaymentAccountDeclarations
  );

  return useQuery({
    queryKey: cuentasCobroQueryKeys.declarationsByAccount(contractId, numeroCuenta),
    enabled: Boolean(contractId) && Number.isInteger(numeroCuenta),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CuentaCobroDeclarationsResponse>>(
        `/api/cuentas-cobro/contrato/${contractId}/cuentas/${numeroCuenta}/declaraciones`
      );
      if (!data.success) throw new Error(data.message);

      if (data.data.declarations) {
        setPaymentAccountDeclarations(contractId, numeroCuenta, data.data.declarations);
      }

      return data.data;
    },
  });
}

export function useSaveCuentaCobroDeclarationsMutation(
  contractId: string,
  numeroCuenta: number
) {
  const queryClient = useQueryClient();
  const setPaymentAccountDeclarations = useCuentasCobroStore(
    (s) => s.setPaymentAccountDeclarations
  );

  return useMutation({
    mutationFn: async (declarations: PaymentAccountDeclarations) => {
      const { data } = await api.put<ApiResponse<CuentaCobroDeclarationsResponse>>(
        `/api/cuentas-cobro/contrato/${contractId}/cuentas/${numeroCuenta}/declaraciones`,
        declarations
      );
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: (result) => {
      if (result.declarations) {
        setPaymentAccountDeclarations(contractId, numeroCuenta, result.declarations);
      }
      queryClient.invalidateQueries({
        queryKey: cuentasCobroQueryKeys.declarationsByAccount(
          contractId,
          numeroCuenta
        ),
      });
    },
  });
}

export function useCuentaCobroActivitiesQuery(
  contractId: string,
  numeroCuenta: number
) {
  return useQuery({
    queryKey: cuentasCobroQueryKeys.activitiesByAccount(contractId, numeroCuenta),
    enabled: Boolean(contractId) && Number.isInteger(numeroCuenta),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CuentaCobroActivitiesResponse>>(
        `/api/cuentas-cobro/contrato/${contractId}/cuentas/${numeroCuenta}/actividades`
      );
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
  });
}

export type SaveCuentaCobroActivityItem = Pick<
  PublicCuentaCobroActividadItem,
  "orden" | "actividad" | "accion" | "soporteTipo" | "soporteTexto" | "ejecucion"
> & {
  file?: File | null;
};

export function useSaveCuentaCobroActivitiesMutation(
  contractId: string,
  numeroCuenta: number
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activities: SaveCuentaCobroActivityItem[]) => {
      const formData = new FormData();
      const payload = activities.map((activity, index) => {
        const soporteFileKey =
          activity.soporteTipo === "ARCHIVO" && activity.file
            ? `file_${index}`
            : null;
        if (soporteFileKey && activity.file) {
          formData.append(soporteFileKey, activity.file);
        }
        return {
          orden: activity.orden,
          actividad: activity.actividad,
          accion: activity.accion,
          soporteTipo: activity.soporteTipo,
          soporteTexto: activity.soporteTexto,
          soporteFileKey,
          ejecucion: activity.ejecucion,
        };
      });

      formData.append("payload", JSON.stringify(payload));

      const { data } = await api.put<ApiResponse<CuentaCobroActivitiesResponse>>(
        `/api/cuentas-cobro/contrato/${contractId}/cuentas/${numeroCuenta}/actividades`,
        formData
      );
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: cuentasCobroQueryKeys.activitiesByAccount(
          contractId,
          numeroCuenta
        ),
      });
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

export function usePaymentAccountReviewListQuery() {
  return useQuery({
    queryKey: cuentasCobroQueryKeys.reviewList,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaymentAccountReviewListResponse>>(
        "/api/cuentas-cobro/revision"
      );
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
  });
}

export function usePaymentAccountReviewDetailQuery(
  contractId: string,
  numeroCuenta: number
) {
  return useQuery({
    queryKey: cuentasCobroQueryKeys.reviewDetail(contractId, numeroCuenta),
    enabled: Boolean(contractId) && Number.isInteger(numeroCuenta),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaymentAccountReviewDetailResponse>>(
        `/api/cuentas-cobro/revision/${contractId}/${numeroCuenta}`
      );
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
  });
}

export function usePaymentAccountWorkflowMutation(
  contractId: string,
  numeroCuenta: number
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      action,
      mensaje,
    }: {
      action: CuentaCobroWorkflowAction;
      mensaje?: string;
    }) => {
      const { data } = await api.post<ApiResponse<{ paymentAccount: PublicCuentaCobro }>>(
        `/api/cuentas-cobro/contrato/${contractId}/cuentas/${numeroCuenta}/workflow`,
        { action, mensaje }
      );
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cuentasCobroQueryKeys.summary });
      queryClient.invalidateQueries({ queryKey: cuentasCobroQueryKeys.reviewList });
      queryClient.invalidateQueries({
        queryKey: cuentasCobroQueryKeys.reviewDetail(contractId, numeroCuenta),
      });
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      queryClient.invalidateQueries({ queryKey: ["contratos", contractId] });
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
      plantillaMetadata,
    }: {
      file?: File | null;
      tipoDocumento: string;
      required?: boolean;
      plantillaMetadata?: SeguridadSocialPlantillaMetadata;
    }) => {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      }
      formData.append("tipoDocumento", tipoDocumento);
      formData.append("required", String(required));

      if (plantillaMetadata) {
        formData.append("plantillaModo", plantillaMetadata.modo);
        if (plantillaMetadata.modo === "UNICO") {
          formData.append("plantillaUnica", plantillaMetadata.plantillaPension);
        } else {
          formData.append("plantillaPension", plantillaMetadata.plantillaPension);
          formData.append("plantillaEps", plantillaMetadata.plantillaEps);
          formData.append("plantillaArl", plantillaMetadata.plantillaArl);
        }
      }

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
