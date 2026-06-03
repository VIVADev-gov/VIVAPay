import axios from "axios";

export type ApiErrorDetails = {
  message: string;
  code?: string;
  status?: number;
};

export function getApiErrorDetails(
  error: unknown,
  fallback = "Ocurrió un error"
): ApiErrorDetails {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; code?: string } | undefined;
    return {
      message: data?.message ?? error.message ?? fallback,
      code: data?.code,
      status: error.response?.status,
    };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: fallback };
}

export function getApiErrorMessage(error: unknown, fallback = "Ocurrió un error"): string {
  return getApiErrorDetails(error, fallback).message;
}
