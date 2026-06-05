"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/loaders/loader";
import { getDashboardPathForRole } from "@/lib/auth/roles";
import { useAuthStore } from "@/store/auth/auth.store";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    router.replace(getDashboardPathForRole(user.role));
  }, [isHydrated, router, user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background via-muted/40 to-background">
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-8 text-card-foreground">
        <Loader size="md" label="Redirigiendo" />
        <p className="text-sm font-semibold text-foreground">
          Preparando tu portal según tu rol...
        </p>
      </div>
    </div>
  );
}
