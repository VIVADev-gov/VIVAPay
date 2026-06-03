"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth/auth.store";

export function useLogout() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  return () => {
    logout();
    router.push("/auth/login");
  };
}
