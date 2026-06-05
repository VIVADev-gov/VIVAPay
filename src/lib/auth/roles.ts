import {
  USER_ROLES,
  type UserRole,
} from "@/constants/userRoles";

export function normalizeUserRole(value?: string | null): UserRole {
  const role = value?.trim().toUpperCase();
  if (role && Object.values(USER_ROLES).includes(role as UserRole)) {
    return role as UserRole;
  }
  return USER_ROLES.CONTRATISTA;
}

export function getDashboardPathForRole(role?: string | null) {
  switch (normalizeUserRole(role)) {
    case USER_ROLES.SUPERVISOR:
      return "/dashboard/supervisor";
    case USER_ROLES.JEFE:
      return "/dashboard/jefe";
    case USER_ROLES.DIRECTOR:
      return "/dashboard/director";
    default:
      return "/dashboard/contratista";
  }
}

export function getRoleSlug(role?: string | null) {
  return normalizeUserRole(role).toLowerCase();
}

export function roleCanAccessDashboardPath(
  role: string | null | undefined,
  pathname: string
) {
  const normalizedRole = normalizeUserRole(role);
  const roleSlug = getRoleSlug(normalizedRole);
  const roleBase = `/dashboard/${roleSlug}`;

  if (pathname === "/dashboard" || pathname === "/dashboard/perfil") {
    return true;
  }

  return pathname === roleBase || pathname.startsWith(`${roleBase}/`);
}
