"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import type { PublicMunicipio, PublicSubregion } from "@/types/catalogos";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const catalogosQueryKeys = {
  subregiones: ["catalogos", "subregiones"] as const,
  municipios: (subregionId?: string | null) =>
    ["catalogos", "municipios", subregionId ?? "all"] as const,
};

export function useSubregionesQuery(enabled = true) {
  return useQuery({
    queryKey: catalogosQueryKeys.subregiones,
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await api.get<
        ApiResponse<{ subregiones: PublicSubregion[] }>
      >("/api/catalogos/subregiones");
      if (!data.success) throw new Error(data.message);
      return data.data.subregiones;
    },
  });
}

export function useMunicipiosQuery(subregionId?: string | null, enabled = true) {
  return useQuery({
    queryKey: catalogosQueryKeys.municipios(subregionId),
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const params = subregionId ? { subregionId } : undefined;
      const { data } = await api.get<
        ApiResponse<{ municipios: PublicMunicipio[] }>
      >("/api/catalogos/municipios", { params });
      if (!data.success) throw new Error(data.message);
      return data.data.municipios;
    },
  });
}
