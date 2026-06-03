import { create } from "zustand";
import { createUiActions, type UiStore } from "./ui-actions";
import { initialUiState } from "./ui.storage";

export const useUiStore = create<UiStore>()((...args) => ({
  ...initialUiState,
  ...createUiActions(...args),
}));

export const uiStore = {
  getState: useUiStore.getState,
  setState: useUiStore.setState,
  subscribe: useUiStore.subscribe,
};
