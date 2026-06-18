"use client";

import { usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { DashboardNavItem } from "@/lib/navigation/dashboardNav";
import {
  getDashboardNavItems,
  isDashboardNavItemActive,
} from "@/lib/navigation/dashboardNav";
import { normalizeUserRole } from "@/lib/auth/roles";
import { useAuthStore } from "@/store/auth/auth.store";

export function useDashboardNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const role = normalizeUserRole(user?.role);

  const items = useMemo(() => getDashboardNavItems(role), [role]);

  const isItemActive = useCallback(
    (item: DashboardNavItem) => isDashboardNavItemActive(pathname, item),
    [pathname]
  );

  return { items, isItemActive, pathname };
}
