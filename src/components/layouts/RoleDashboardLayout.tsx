"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { UserRole } from "@/constants/userRoles";
import {
  getDashboardPathForRole,
  roleCanAccessDashboardPath,
} from "@/lib/auth/roles";
import { useAuthStore } from "@/store/auth/auth.store";
import DashboardLayout, { type DashboardLayoutProps } from "./DashboardLayout";

type RoleDashboardLayoutProps = DashboardLayoutProps & {
  allowedRole?: UserRole;
};

export default function RoleDashboardLayout({
  allowedRole,
  children,
  ...layoutProps
}: RoleDashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated || !user) return;

    if (allowedRole && user.role !== allowedRole) {
      router.replace(getDashboardPathForRole(user.role));
      return;
    }

    if (!roleCanAccessDashboardPath(user.role, pathname)) {
      router.replace(getDashboardPathForRole(user.role));
    }
  }, [allowedRole, isHydrated, pathname, router, user]);

  return <DashboardLayout {...layoutProps}>{children}</DashboardLayout>;
}
