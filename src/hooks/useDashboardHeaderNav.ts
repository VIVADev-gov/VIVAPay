"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useContratosQuery } from "@/hooks/api/useContratos";
import { useCuentasCobroSummaryQuery } from "@/hooks/api/useCuentasCobro";
import { getDashboardPathForRole, normalizeUserRole } from "@/lib/auth/roles";
import {
  resolveHeaderNavLinks,
  type HeaderNavItem,
} from "@/lib/navigation/resolveHeaderNavLinks";
import { USER_ROLES } from "@/constants/userRoles";
import { useAuthStore } from "@/store/auth/auth.store";
import { useContratosStore } from "@/store/contratos/contratos.store";
import { useCuentasCobroStore } from "@/store/cuentas-cobro/cuentas-cobro.store";

export function useDashboardHeaderNav(): { items: HeaderNavItem[] } {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const role = normalizeUserRole(user?.role);
  const isContratista = role === USER_ROLES.CONTRATISTA;

  useContratosQuery();
  useCuentasCobroSummaryQuery();

  const currentContract = useContratosStore((s) => s.currentContract);
  const lastContract = useContratosStore((s) => s.lastContract);
  const detailContract = useContratosStore((s) => s.detail?.contract ?? null);
  const nextPaymentAccount = useCuentasCobroStore((s) => s.nextPaymentAccount);
  const lastPaymentAccount = useCuentasCobroStore((s) => s.lastPaymentAccount);

  const items = useMemo(
    () =>
      resolveHeaderNavLinks({
        role,
        pathname,
        roleBase: getDashboardPathForRole(role),
        currentContract: isContratista ? currentContract : null,
        lastContract: isContratista ? lastContract : null,
        detailContract: isContratista ? detailContract : null,
        nextPaymentAccount: isContratista ? nextPaymentAccount : null,
        lastPaymentAccount: isContratista ? lastPaymentAccount : null,
      }),
    [
      role,
      pathname,
      isContratista,
      currentContract,
      lastContract,
      detailContract,
      nextPaymentAccount,
      lastPaymentAccount,
    ]
  );

  return { items };
}
