"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpdateProfileBodyDto } from "@/app/api/profile/dto/update-profile.dto";
import api from "@/lib/axiosInstance";
import { useAuthStore } from "@/store/auth/auth.store";
import type { AuthUser } from "@/store/auth/auth.storage";
import { useProfileStore } from "@/store/profile/profile.store";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const profileQueryKeys = {
  me: ["profile", "me"] as const,
};

export function useProfileQuery() {
  const setProfileLoading = useProfileStore((s) => s.setProfileLoading);
  const setProfileError = useProfileStore((s) => s.setProfileError);
  const setProfileUser = useProfileStore((s) => s.setProfileUser);

  return useQuery({
    queryKey: profileQueryKeys.me,
    queryFn: async () => {
      setProfileLoading(true);
      setProfileError(null);
      try {
        const { data } = await api.get<ApiResponse<{ user: AuthUser }>>(
          "/api/profile"
        );
        if (!data.success) throw new Error(data.message);
        setProfileUser(data.data.user);
        return data.data.user;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Error al cargar perfil";
        setProfileError(message);
        throw error;
      } finally {
        setProfileLoading(false);
      }
    },
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const setSession = useAuthStore((state) => state.setSession);
  const setProfileSaving = useProfileStore((s) => s.setProfileSaving);
  const setProfileError = useProfileStore((s) => s.setProfileError);
  const setProfileSuccess = useProfileStore((s) => s.setProfileSuccess);
  const setProfileUser = useProfileStore((s) => s.setProfileUser);

  return useMutation({
    mutationFn: async (body: UpdateProfileBodyDto) => {
      setProfileSaving(true);
      setProfileError(null);
      const { data } = await api.patch<ApiResponse<{ user: AuthUser }>>(
        "/api/profile",
        body
      );
      if (!data.success) throw new Error(data.message);
      return data.data.user;
    },
    onSuccess: (user) => {
      if (token) {
        setSession(token, user);
      }
      setProfileUser(user);
      setProfileSuccess("Perfil actualizado correctamente.");
      queryClient.setQueryData(profileQueryKeys.me, user);
    },
    onError: (error) => {
      setProfileError(
        error instanceof Error ? error.message : "Error al actualizar perfil"
      );
      setProfileSaving(false);
    },
    onSettled: () => {
      setProfileSaving(false);
    },
  });
}
