"use client";

import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import type { RegisterBodyDto } from "@/app/api/auth/register/dto/register.dto";
import type { LoginBodyDto } from "@/app/api/auth/login/dto/login.dto";
import type { ForgotPasswordBodyDto } from "@/app/api/auth/forgot-password/dto/forgot-password.dto";
import type { ResetPasswordBodyDto } from "@/app/api/auth/reset-password/dto/reset-password.dto";
import type { AuthUser } from "@/store/auth/auth.storage";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export function useRegisterMutation() {
  return useMutation({
    mutationFn: async (body: RegisterBodyDto) => {
      const { data } = await api.post<ApiResponse<{ email: string }>>(
        "/api/auth/register",
        body
      );
      if (!data.success) throw new Error(data.message);
      return data;
    },
  });
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: async (body: LoginBodyDto) => {
      const { data } = await api.post<
        ApiResponse<{ token: string; user: AuthUser }>
      >("/api/auth/login", body);
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
  });
}

export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await api.get<
        ApiResponse<{ alreadyVerified: boolean }>
      >("/api/auth/verify-email", { params: { token } });
      if (!data.success) throw new Error(data.message);
      return data;
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: async (body: ForgotPasswordBodyDto) => {
      const { data } = await api.post<ApiResponse<null>>(
        "/api/auth/forgot-password",
        body
      );
      if (!data.success) throw new Error(data.message);
      return data;
    },
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: async (body: ResetPasswordBodyDto) => {
      const { data } = await api.post<ApiResponse<null>>(
        "/api/auth/reset-password",
        body
      );
      if (!data.success) throw new Error(data.message);
      return data;
    },
  });
}
