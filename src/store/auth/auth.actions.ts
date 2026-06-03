import type { StateCreator } from "zustand";
import {
  clearAuthStorage,
  initialAuthState,
  readTokenFromStorage,
  readUserFromStorage,
  writeTokenToStorage,
  writeUserToStorage,
  type AuthState,
  type AuthUser,
} from "./auth.storage";

export type AuthActions = {
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
  hydrateFromStorage: () => void;
};

export type AuthStore = AuthState & AuthActions;

export const createAuthActions: StateCreator<AuthStore, [], [], AuthActions> = (set) => ({
  setSession: (token, user) => {
    writeTokenToStorage(token);
    writeUserToStorage(user);
    set({ token, user, isHydrated: true });
  },

  logout: () => {
    clearAuthStorage();
    set({ ...initialAuthState, isHydrated: true });
  },

  hydrateFromStorage: () => {
    const token = readTokenFromStorage();
    const user = readUserFromStorage();
    set({
      token,
      user,
      isHydrated: true,
    });
  },
});
