"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth/auth.store";

export default function AuthHydrator() {
  const hydrateFromStorage = useAuthStore((s) => s.hydrateFromStorage);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  return null;
}
