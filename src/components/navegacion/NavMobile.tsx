"use client";

import React, { useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ChevronDown, LogOut, X } from "lucide-react";
import Link from "next/link";
import ActionButton from "@/components/buttons/ActionButton";
import Logo from "@/components/logo/Logo";
import { Badge } from "./NavigationItem";
import type { NavMenuItem } from "./navigation.types";

type MobileMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  menuItems: NavMenuItem[];
  isItemActive: (item: NavMenuItem) => boolean;
  onLogout: () => void;
};

export const MobileMenu = ({
  isOpen,
  onClose,
  menuItems,
  isItemActive,
  onLogout,
}: MobileMenuProps) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleSubmenu = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const renderMenuItem = (
    item: NavMenuItem,
    isSubmenu = false,
    index = 0
  ): React.ReactNode => {
    const hasSubmenu = Boolean(item.submenu?.length);
    const isActive = isItemActive(item);

    const itemVariants: Variants = {
      hidden: { opacity: 0, x: -20 },
      visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.2, delay: index * 0.04, ease: "easeOut" },
      },
    };

    const containerClass = [
      "flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left",
      isSubmenu ? "ml-3 border-l border-border pl-3" : "",
      isActive
        ? "bg-primary text-primary-foreground shadow-md"
        : "text-foreground hover:bg-muted",
    ]
      .filter(Boolean)
      .join(" ");

    const itemContent = (
      <>
        <div className="flex items-center">
          {React.cloneElement(item.icon, {
            className: `mr-3 shrink-0 ${isSubmenu ? "h-4 w-4" : "h-5 w-5"} ${
              isActive ? "text-primary-foreground" : "text-muted-foreground"
            }`,
          })}
          <span className={`font-semibold ${isSubmenu ? "text-sm" : "text-base"}`}>
            {item.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {item.badge != null ? (
            <Badge variant={item.badgeVariant ?? "default"} active={isActive}>
              {item.badge}
            </Badge>
          ) : null}
          {hasSubmenu ? (
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                expandedItems.has(item.id) ? "rotate-180" : ""
              } ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`}
            />
          ) : null}
        </div>
      </>
    );

    return (
      <motion.div
        key={item.id}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        {hasSubmenu ? (
          <button type="button" className={containerClass} onClick={() => toggleSubmenu(item.id)}>
            {itemContent}
          </button>
        ) : (
          <Link href={item.path ?? "/dashboard"} className={containerClass} onClick={onClose}>
            {itemContent}
          </Link>
        )}

        <AnimatePresence>
          {hasSubmenu && expandedItems.has(item.id) ? (
            <motion.div
              className="mt-2 space-y-1"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {item.submenu!.map((subItem, subIndex) =>
                renderMenuItem(subItem, true, subIndex)
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col border-r border-border bg-card text-foreground shadow-2xl"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
          >
            <div className="relative border-b border-border/60 px-4 pb-5 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 rounded-xl border border-border bg-background p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex flex-col items-center gap-2 pr-2 pt-1">
                <Logo size="small" variant="default" alt="Vivapay" />
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Vivapay
                </p>
              </div>
            </div>

            <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-5">
              <div className="space-y-2">
                {menuItems.map((item, index) => renderMenuItem(item, false, index))}
              </div>
            </nav>

            <div className="border-t border-border/60 p-4">
              <ActionButton
                variant="outline"
                className="w-full"
                icon={LogOut}
                label="Cerrar sesión"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
              />
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
};

export default MobileMenu;
