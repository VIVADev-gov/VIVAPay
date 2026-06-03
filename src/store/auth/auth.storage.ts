export type AuthUser = {
  id: string;
  email: string;
  name: string;
  documentId?: string;
  phone?: string;
  area?: string;
  emailVerified?: boolean;
  status?: string;
};

export type AuthState = {
  token: string | null;
  user: AuthUser | null;
  isHydrated: boolean;
};

export const initialAuthState: AuthState = {
  token: null,
  user: null,
  isHydrated: false,
};

const TOKEN_KEY = "token";
const USER_KEY = "auth_user";

export function readTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function readUserFromStorage(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function writeTokenToStorage(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function writeUserToStorage(user: AuthUser | null): void {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function clearAuthStorage(): void {
  writeTokenToStorage(null);
  writeUserToStorage(null);
}
