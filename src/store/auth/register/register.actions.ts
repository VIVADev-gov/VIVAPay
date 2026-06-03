import type { StateCreator } from "zustand";
import type { RegisterStore } from "./register.store";

export type RegisterActions = {
  setStep: (step: number) => void;
  reset: () => void;
};

export const createRegisterActions: StateCreator<
  RegisterStore,
  [],
  [],
  RegisterActions
> = (set) => ({
  setStep: (step) => set({ step }),
  reset: () => set({ step: 0 }),
});
