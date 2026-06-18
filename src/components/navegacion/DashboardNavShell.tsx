"use client";

import { useDashboardNav } from "@/hooks/useDashboardNav";
import { useLogout } from "@/hooks/useLogout";
import MobileMenu from "./NavMobile";
import Sidebar from "./NavSidebar";

type DashboardNavShellProps = {
  mobileMenuOpen: boolean;
  onMobileMenuClose: () => void;
};

export default function DashboardNavShell({
  mobileMenuOpen,
  onMobileMenuClose,
}: DashboardNavShellProps) {
  const logout = useLogout();
  const { items, isItemActive } = useDashboardNav();

  return (
    <>
      <Sidebar
        menuItems={items}
        isItemActive={isItemActive}
        onLogout={logout}
      />
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={onMobileMenuClose}
        menuItems={items}
        isItemActive={isItemActive}
        onLogout={logout}
      />
    </>
  );
}
