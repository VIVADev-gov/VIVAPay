"use client";

import { create } from "zustand";
import { createContratosActions, type ContratosStore } from "./contratos.actions";
import { initialContratosState } from "./contratos.storage";

export const useContratosStore = create<ContratosStore>()((...args) => ({
  ...initialContratosState,
  ...createContratosActions(...args),
}));
