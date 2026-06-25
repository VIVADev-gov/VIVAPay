"use client";

import Link from "next/link";
import type { HeaderNavItem } from "@/lib/navigation/resolveHeaderNavLinks";

type DashboardHeaderNavItemsProps = {
  items: HeaderNavItem[];
};

function NavLink({
  item,
  variant,
}: {
  item: HeaderNavItem;
  variant: "desktop" | "mobile";
}) {
  const isDesktop = variant === "desktop";

  return (
    <Link
      href={item.href}
      aria-current={item.isActive ? "page" : undefined}
      className={
        isDesktop
          ? `
            whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-semibold transition-all duration-200
            ${
              item.isActive
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }
          `
          : `
            whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200
            ${
              item.isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border/60 bg-background/70 text-muted-foreground"
            }
          `
      }
    >
      {item.label}
    </Link>
  );
}

export function DashboardHeaderNavDesktop({ items }: DashboardHeaderNavItemsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Acceso rápido"
      className="hidden min-w-0 flex-1 items-center justify-center md:flex"
    >
      <div className="flex max-w-full items-center gap-2 overflow-x-auto scrollbar-hide">
        {items.map((item) => (
          <NavLink key={item.id} item={item} variant="desktop" />
        ))}
      </div>
    </nav>
  );
}

export function DashboardHeaderNavMobile({ items }: DashboardHeaderNavItemsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Acceso rápido"
      className="border-t border-border/50 bg-muted/20 px-4 py-2.5 md:hidden"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto scrollbar-hide md:px-6 lg:px-8">
        {items.map((item) => (
          <NavLink key={item.id} item={item} variant="mobile" />
        ))}
      </div>
    </nav>
  );
}
