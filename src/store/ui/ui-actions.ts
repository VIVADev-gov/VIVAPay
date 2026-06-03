import type { StateCreator } from "zustand";
import type { ToastVariant } from "@/components/toast/Toast";
import {
  initialUiState,
  type ModalSize,
  type UiModalState,
  type UiState,
  type UiToastState,
} from "./ui.storage";

export type OpenModalParams = {
  title?: string;
  content: React.ReactNode;
  tamaño?: ModalSize;
  canClose?: boolean;
};

export type ShowToastParams = {
  message: string;
  variant?: ToastVariant;
  autoClose?: number;
  inModal?: boolean;
};

export type UiActions = {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  setLoadingProgress: (progress: number | null) => void;
  setLoadingMessage: (message: string | null) => void;
  showToast: (params: ShowToastParams) => void;
  hideToast: () => void;
  openModal: (params: OpenModalParams) => void;
  closeModal: () => void;
  updateModal: (
    partial: Partial<Pick<UiModalState, "title" | "content" | "tamaño" | "canClose">>
  ) => void;
};

export type UiStore = UiState & UiActions;

export const createUiActions: StateCreator<UiStore, [], [], UiActions> = (set) => ({
  showLoading: (message) =>
    set({
      isLoading: true,
      loadingMessage: message ?? null,
      loadingProgress: null,
    }),

  hideLoading: () =>
    set({
      isLoading: false,
      loadingMessage: null,
      loadingProgress: null,
    }),

  setLoadingProgress: (progress) => set({ loadingProgress: progress }),

  setLoadingMessage: (message) => set({ loadingMessage: message }),

  showToast: ({ message, variant = "info", autoClose = 4000, inModal }) =>
    set({
      toast: { message, variant, autoClose, inModal } satisfies UiToastState,
    }),

  hideToast: () => set({ toast: null }),

  openModal: ({ title = "", content, tamaño = "lg", canClose = true }) =>
    set({
      modal: {
        isOpen: true,
        title,
        content,
        tamaño,
        canClose,
      },
    }),

  closeModal: () =>
    set({
      modal: { ...initialUiState.modal, isOpen: false, content: null },
    }),

  updateModal: (partial) =>
    set((state) => ({
      modal: { ...state.modal, ...partial },
    })),
});
