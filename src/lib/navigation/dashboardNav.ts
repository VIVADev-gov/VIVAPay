import {
  ClipboardCheck,
  FileText,
  Home,
  UserRound,
} from "lucide-react";
import { createElement } from "react";
import type { NavMenuItem } from "@/components/navegacion/navigation.types";
import { USER_ROLES, type UserRole } from "@/constants/userRoles";
import { getDashboardPathForRole } from "@/lib/auth/roles";
import { isNavItemActive } from "@/lib/navigation/matchNavPath";

export type DashboardNavItem = NavMenuItem & {
  matchExact?: boolean;
};

const PROFILE_PATH = "/dashboard/perfil";

function homeItem(role: UserRole): DashboardNavItem {
  return {
    id: "home",
    label: "Inicio",
    path: getDashboardPathForRole(role),
    matchExact: true,
    icon: createElement(Home, { size: 20, className: "h-5 w-5" }),
  };
}

function profileItem(): DashboardNavItem {
  return {
    id: "profile",
    label: "Perfil",
    path: PROFILE_PATH,
    matchExact: true,
    icon: createElement(UserRound, { size: 20, className: "h-5 w-5" }),
  };
}

const NAV_BY_ROLE: Record<UserRole, DashboardNavItem[]> = {
  [USER_ROLES.CONTRATISTA]: [
    homeItem(USER_ROLES.CONTRATISTA),
    {
      id: "contracts",
      label: "Contratos",
      path: "/dashboard/contratista/contrato",
      icon: createElement(FileText, { size: 20, className: "h-5 w-5" }),
    },
    profileItem(),
  ],
  [USER_ROLES.SUPERVISOR]: [
    homeItem(USER_ROLES.SUPERVISOR),
    {
      id: "payment-accounts",
      label: "Cuentas de cobro",
      path: "/dashboard/supervisor/cuentas-cobro",
      icon: createElement(ClipboardCheck, { size: 20, className: "h-5 w-5" }),
    },
    profileItem(),
  ],
  [USER_ROLES.JEFE]: [
    homeItem(USER_ROLES.JEFE),
    {
      id: "payment-accounts",
      label: "Cuentas de cobro",
      path: "/dashboard/jefe/cuentas-cobro",
      icon: createElement(ClipboardCheck, { size: 20, className: "h-5 w-5" }),
    },
    profileItem(),
  ],
  [USER_ROLES.DIRECTOR]: [
    homeItem(USER_ROLES.DIRECTOR),
    {
      id: "payment-accounts",
      label: "Cuentas de cobro",
      path: "/dashboard/director/cuentas-cobro",
      icon: createElement(ClipboardCheck, { size: 20, className: "h-5 w-5" }),
    },
    profileItem(),
  ],
};

export function getDashboardNavItems(role: UserRole): DashboardNavItem[] {
  return NAV_BY_ROLE[role] ?? NAV_BY_ROLE[USER_ROLES.CONTRATISTA];
}

export function isDashboardNavItemActive(
  pathname: string,
  item: DashboardNavItem
) {
  if (!item.path) return false;
  return isNavItemActive(pathname, item.path, { exact: item.matchExact });
}
