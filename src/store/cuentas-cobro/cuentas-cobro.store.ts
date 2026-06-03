"use client";

import { create } from "zustand";
import {
  createCuentasCobroActions,
  type CuentasCobroStore,
} from "./cuentas-cobro.actions";
import { initialCuentasCobroState } from "./cuentas-cobro.storage";

export const useCuentasCobroStore = create<CuentasCobroStore>()((...args) => ({
  ...initialCuentasCobroState,
  ...createCuentasCobroActions(...args),
}));
