import type { ReactElement, ReactNode } from "react";

export type NavBadgeVariant = "default" | "notification" | "success" | "warning";

export type NavMenuItemIcon = ReactElement<{ className?: string; size?: number }>;

export interface NavMenuItem {
  id: string;
  path?: string;
  label: string;
  icon: NavMenuItemIcon;
  submenu?: NavMenuItem[];
  badge?: ReactNode;
  badgeVariant?: NavBadgeVariant;
}

/** Busca un ítem por id en el árbol del menú (incluye submenús). */
export function findNavMenuItemById(
  items: NavMenuItem[],
  id: string,
): NavMenuItem | undefined {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.submenu?.length) {
      const found = findNavMenuItemById(item.submenu, id);
      if (found) return found;
    }
  }
  return undefined;
}
