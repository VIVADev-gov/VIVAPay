"use client";

import { create } from "zustand";
import { createAuthActions, type AuthStore } from "./auth.actions";
import { initialAuthState } from "./auth.storage";

export const useAuthStore = create<AuthStore>()((...args) => ({
  ...initialAuthState,
  ...createAuthActions(...args),
}));
