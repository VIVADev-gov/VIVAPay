"use client";

import { useEffect } from "react";
import { useLogout } from "@/hooks/useLogout";
import { registerUnauthorizedHandler } from "@/lib/sessionUnauthorized";
import { useUiStore } from "@/store/ui/ui-store";

export default function SessionUnauthorizedHandler() {
  const logout = useLogout();
  const showToast = useUiStore((state) => state.showToast);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      showToast({
        message: "Tu sesión expiró. Inicia sesión de nuevo.",
        variant: "warning",
      });
      logout();
    });
  }, [logout, showToast]);

  return null;
}
