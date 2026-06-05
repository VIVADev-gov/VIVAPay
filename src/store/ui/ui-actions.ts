import type { StateCreator } from "zustand";
import type { ToastVariant } from "@/components/toast/Toast";
import {
  initialUiState,
  type ModalSize,
  type TableViewMode,
  type UiModalState,
  type UiState,
  type UiToastState,
} from "./ui.storage";

const TABLE_VIEW_MODES_STORAGE_KEY = "vivapay:ui:table-view-modes";

function readTableViewModes(): Record<string, TableViewMode> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(TABLE_VIEW_MODES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([, value]) => value === "table" || value === "card"
      )
    ) as Record<string, TableViewMode>;
  } catch {
    return {};
  }
}

function writeTableViewModes(modes: Record<string, TableViewMode>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TABLE_VIEW_MODES_STORAGE_KEY, JSON.stringify(modes));
  } catch {
    // La preferencia visual no debe bloquear la interacción si el navegador falla.
  }
}

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
  hydrateTableViewModes: () => void;
  setTableViewMode: (key: string, mode: TableViewMode) => void;
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

  hydrateTableViewModes: () =>
    set((state) => {
      if (state.tableViewModesHydrated) return state;
      return {
        tableViewModes: readTableViewModes(),
        tableViewModesHydrated: true,
      };
    }),

  setTableViewMode: (key, mode) =>
    set((state) => {
      const currentModes = state.tableViewModesHydrated
        ? state.tableViewModes
        : readTableViewModes();
      const tableViewModes = {
        ...currentModes,
        [key]: mode,
      };
      writeTableViewModes(tableViewModes);
      return { tableViewModes, tableViewModesHydrated: true };
    }),
});
