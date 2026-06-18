"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import ActionButton from "@/components/buttons/ActionButton";
import Logo from "@/components/logo/Logo";
import { NavigationItem } from "./NavigationItem";
import type { NavMenuItem } from "./navigation.types";

type SidebarHeaderProps = {
  isExpanded: boolean;
};

export const SidebarHeader = ({ isExpanded }: SidebarHeaderProps) => (
  <div
    className={`border-b border-border/60 ${isExpanded ? "px-4 py-5" : "px-2 py-4"}`}
  >
    <div className="flex flex-col items-center gap-2">
      <Logo size="small" variant="default" alt="Vivapay" />
      {isExpanded ? (
        <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Vivapay
        </p>
      ) : null}
    </div>
  </div>
);

type SidebarProps = {
  menuItems: NavMenuItem[];
  isItemActive: (item: NavMenuItem) => boolean;
  onLogout: () => void;
};

export const Sidebar = ({ menuItems, isItemActive, onLogout }: SidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const sidebarVariants = {
    collapsed: { width: 72 },
    expanded: { width: 256 },
  };

  return (
    <motion.aside
      className="fixed left-0 top-0 z-50 hidden h-screen flex-col border-r border-border/60 bg-card/95 text-foreground shadow-sm backdrop-blur-md md:flex"
      variants={sidebarVariants}
      animate={isExpanded ? "expanded" : "collapsed"}
      initial="collapsed"
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      layout
    >
      <SidebarHeader isExpanded={isExpanded} />

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-2 py-4">
        <div
          className={`flex flex-col space-y-1 ${
            isExpanded ? "items-stretch" : "items-center"
          }`}
        >
          {menuItems.map((item) => (
            <NavigationItem
              key={item.id}
              item={item}
              isActive={isItemActive(item)}
              isExpanded={isExpanded}
              isItemActive={isItemActive}
            />
          ))}
        </div>
      </nav>

      <div className="border-t border-border/60 p-3">
        <ActionButton
          variant="outline"
          className={`w-full ${isExpanded ? "px-4" : "px-2"}`}
          icon={LogOut}
          label={isExpanded ? "Cerrar sesión" : null}
          onClick={onLogout}
        />
      </div>
    </motion.aside>
  );
};

export default Sidebar;
