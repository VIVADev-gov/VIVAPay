"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import type { NavMenuItem, NavBadgeVariant } from "./navigation.types";

type BadgeProps = {
  children: React.ReactNode;
  variant?: NavBadgeVariant;
  active?: boolean;
};

const badgeVariantClasses: Record<NavBadgeVariant, (active: boolean) => string> = {
  default: (active) =>
    active
      ? "bg-primary-foreground/20 text-primary-foreground"
      : "bg-muted text-muted-foreground",
  notification: () => "bg-destructive text-destructive-foreground",
  success: () => "bg-green-600 text-white",
  warning: () => "bg-yellow-500 text-white",
};

export const Badge = ({
  children,
  variant = "default",
  active = false,
}: BadgeProps) => (
  <span
    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeVariantClasses[variant](active)}`}
  >
    {children}
  </span>
);

type NavigationItemProps = {
  item: NavMenuItem;
  isActive: boolean;
  isExpanded: boolean;
  depth?: number;
  onNavigate?: () => void;
  isItemActive?: (item: NavMenuItem) => boolean;
};

export const NavigationItem = ({
  item,
  isActive,
  isExpanded,
  depth = 0,
  onNavigate,
  isItemActive,
}: NavigationItemProps) => {
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const hasSubmenu = Boolean(item.submenu?.length);

  const itemVariants: Variants = {
    inactive: { scale: 1 },
    active: { scale: isActive ? 1.01 : 1 },
    hover: { scale: 1.01 },
  };

  const itemContent = (
    <>
      <div className="relative z-10 flex flex-1 items-center">
        {React.cloneElement(item.icon, {
          className: `${isExpanded ? "mr-3" : "mr-0"} h-5 w-5 shrink-0 ${
            isActive ? "text-primary-foreground" : "text-muted-foreground"
          }`,
        })}
        {isExpanded ? (
          <span
            className={`font-semibold whitespace-nowrap ${
              isActive ? "text-primary-foreground" : "text-foreground"
            }`}
          >
            {item.label}
          </span>
        ) : null}
      </div>

      {isExpanded && item.badge != null ? (
        <Badge variant={item.badgeVariant ?? "default"} active={isActive}>
          {item.badge}
        </Badge>
      ) : null}

      {isExpanded && hasSubmenu ? (
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${
            isSubmenuOpen ? "rotate-180" : ""
          } ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`}
        />
      ) : null}
    </>
  );

  const containerClass = [
    "mb-1 flex w-full items-center rounded-xl py-2.5 text-left text-sm",
    isExpanded ? "justify-between px-3" : "justify-center px-2",
    depth > 0 ? "ml-1 border-l border-border pl-3" : "",
    isActive
      ? "bg-primary text-primary-foreground shadow-md"
      : "text-foreground hover:bg-muted",
  ]
    .filter(Boolean)
    .join(" ");

  if (hasSubmenu) {
    return (
      <div className="w-full">
        <motion.button
          type="button"
          className={containerClass}
          variants={itemVariants}
          initial="inactive"
          animate={isActive ? "active" : "inactive"}
          whileHover="hover"
          onClick={() => setIsSubmenuOpen((open) => !open)}
        >
          {itemContent}
        </motion.button>

        <AnimatePresence>
          {isSubmenuOpen && isExpanded ? (
            <motion.div
              className="mt-1 space-y-1 overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {item.submenu!.map((subItem) => (
                <NavigationItem
                  key={subItem.id}
                  item={subItem}
                  isActive={isItemActive?.(subItem) ?? false}
                  isExpanded={isExpanded}
                  depth={depth + 1}
                  onNavigate={onNavigate}
                  isItemActive={isItemActive}
                />
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <motion.div
      className={containerClass}
      variants={itemVariants}
      initial="inactive"
      animate={isActive ? "active" : "inactive"}
      whileHover="hover"
    >
      <Link
        href={item.path ?? "/dashboard"}
        className="flex w-full items-center justify-between"
        onClick={onNavigate}
      >
        {itemContent}
      </Link>
    </motion.div>
  );
};
