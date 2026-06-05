import type { ReactNode } from "react";
import type { ToastVariant } from "@/components/toast/Toast";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full" | "fullscreen";
export type TableViewMode = "table" | "card";

export type UiToastState = {
  message: string;
  variant?: ToastVariant;
  autoClose?: number;
  inModal?: boolean;
};

export type UiModalState = {
  isOpen: boolean;
  title: string;
  content: ReactNode | null;
  tamaño: ModalSize;
  canClose: boolean;
};

export type UiState = {
  isLoading: boolean;
  loadingProgress: number | null;
  loadingMessage: string | null;
  toast: UiToastState | null;
  modal: UiModalState;
  tableViewModes: Record<string, TableViewMode>;
  tableViewModesHydrated: boolean;
};

export const initialUiState: UiState = {
  isLoading: true,
  loadingProgress: null,
  loadingMessage: null,
  toast: null,
  modal: {
    isOpen: false,
    title: "",
    content: null,
    tamaño: "lg",
    canClose: true,
  },
  tableViewModes: {},
  tableViewModesHydrated: false,
};
