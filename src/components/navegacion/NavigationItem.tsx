"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { User, ChevronRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import type { NavMenuItem, NavBadgeVariant } from "./navigation.types";

export type UserProfileData = {
  name: string;
  plan: string;
};

type UserProfileProps = {
  user?: UserProfileData;
  isExpanded: boolean;
};

export const UserProfile = ({
  user = { name: "Juan Pérez", plan: "Plan Premium" },
  isExpanded,
}: UserProfileProps) => (
  <motion.div
    className="mb-4 rounded-2xl border border-border/70 bg-card p-3 shadow-sm backdrop-blur-sm"
    layout
    transition={{ duration: 0.3, ease: "easeInOut" }}
  >
    <div className={`flex items-center ${isExpanded ? "space-x-3" : "justify-center"}`}>
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
          <User className="h-5 w-5 text-primary-foreground" />
        </div>
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <p className="text-sm font-semibold leading-tight text-foreground">{user.name}</p>
            <p className="flex items-center text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5" />
              {user.plan}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </motion.div>
);

type BadgeProps = {
  children: React.ReactNode;
  variant?: NavBadgeVariant;
  active?: boolean;
};

const badgeVariantClasses: Record<NavBadgeVariant, (active: boolean) => string> = {
  default: (active) =>
    active
      ? "bg-primary text-primary-foreground shadow-sm"
      : "bg-muted text-muted-foreground",
  notification: () => "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg",
  success: () => "bg-gradient-to-r from-green-500 to-green-600 text-white",
  warning: () => "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white",
};

export const Badge = ({ children, variant = "default", active = false }: BadgeProps) => (
  <motion.span
    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${badgeVariantClasses[variant](active)}`}
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
  >
    {children}
  </motion.span>
);

type NavigationItemProps = {
  item: NavMenuItem;
  isActive: boolean;
  isExpanded: boolean;
  activeSection: string;
  onSectionChange?: (id: string) => void;
  depth?: number;
  /** Aside oscuro tipo dashboard tienda. */
  appearance?: "default" | "darkSidebar";
};

export const NavigationItem = ({
  item,
  isActive,
  isExpanded,
  activeSection,
  onSectionChange,
  depth = 0,
  appearance = "default",
}: NavigationItemProps) => {
  const isDark = appearance === "darkSidebar";
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const hasSubmenu = Boolean(item.submenu && item.submenu.length > 0);

  const handleMouseEnter = () => {
    if (hasSubmenu) {
      setIsSubmenuOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (hasSubmenu) {
      setTimeout(() => setIsSubmenuOpen(false), 200);
    }
  };

  const toggleSubmenu = (e: React.MouseEvent) => {
    if (hasSubmenu) {
      e.preventDefault();
      setIsSubmenuOpen((open) => !open);
    }
  };

  const handleClick = () => {
    if (!hasSubmenu && onSectionChange) {
      onSectionChange(item.id);
    }
  };

  const itemVariants: Variants = {
    inactive: {
      backgroundColor: "transparent",
      scale: 1,
      transition: { duration: 0.2, ease: "easeInOut" },
    },
    active: {
      backgroundColor: "transparent",
      scale: isActive ? 1.01 : 1,
      transition: { duration: 0.2, ease: "easeOut" },
    },
    hover: {
      backgroundColor: "transparent",
      scale: 1.01,
      transition: { duration: 0.15, ease: "easeOut" },
    },
  };

  const iconVariants: Variants = {
    inactive: {
      scale: 1,
      transition: { duration: 0.2 },
    },
    active: {
      scale: 1.05,
      transition: { duration: 0.2 },
    },
  };

  const chevronVariants: Variants = {
    closed: { rotate: 0 },
    open: { rotate: hasSubmenu ? 180 : 90 },
    hover: { x: hasSubmenu ? 0 : 4 },
  };

  const itemContent = (
    <>
      <div className="flex items-center flex-1 relative z-10 ">
        <motion.div variants={iconVariants} animate={isActive ? "active" : "inactive"}>
          {React.cloneElement(item.icon, {
            className: `${isExpanded ? "mr-3" : "mr-0"} h-5 w-5 shrink-0 ${
              isActive
                ? "text-primary-foreground"
                : isDark
                  ? "text-white/70"
                  : "text-muted-foreground"
            }`,
          })}
        </motion.div>
        <AnimatePresence>
          {isExpanded && (
            <motion.span
              className={`font-semibold ${isDark && !isActive ? "text-white/95" : ""}`}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="relative z-10 flex items-center space-x-2"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {item.badge != null && (
              <Badge variant={item.badgeVariant ?? "default"} active={isActive}>
                {item.badge}
              </Badge>
            )}

            {!isDark && (
              <motion.div
                variants={chevronVariants}
                animate={isSubmenuOpen ? "open" : "closed"}
                whileHover="hover"
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {hasSubmenu ? (
                  <ChevronDown
                    className={`h-5 w-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`}
                  />
                ) : (
                  <ChevronRight
                    className={`h-5 w-5 ${isActive ? "text-primary-foreground/80" : "text-primary"}`}
                  />
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  const containerClass = [
    "mb-1 flex w-full cursor-pointer items-center rounded-xl py-2.5 text-left text-base",
    isExpanded ? "justify-between px-3" : "justify-center px-2",
    depth > 0 ? "ml-1 border-l border-white/10 pl-3" : "",
    isActive
      ? "bg-primary text-primary-foreground shadow-md"
      : isDark
        ? "text-white/95 hover:bg-white/[0.07]"
        : "text-foreground hover:bg-muted",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="w-full flex flex-col justify-center gap-4"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className={containerClass}
        variants={itemVariants}
        initial="inactive"
        animate={isActive ? "active" : "inactive"}
        whileHover="hover"
        onClick={hasSubmenu ? toggleSubmenu : handleClick}
        layout
      >
        {hasSubmenu ? (
          itemContent
        ) : (
          <Link href={item.path ?? "/"} className="w-full flex items-center justify-between">
            {itemContent}
          </Link>
        )}
      </motion.div>

      <AnimatePresence>
        {hasSubmenu && isSubmenuOpen && isExpanded && (
          <motion.div
            className="mt-1 space-y-1 overflow-hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {item.submenu!.map((subItem, index) => (
              <motion.div
                key={subItem.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.05,
                  ease: "easeOut",
                }}
              >
                <NavigationItem
                  item={subItem}
                  isActive={activeSection === subItem.id}
                  isExpanded={isExpanded}
                  activeSection={activeSection}
                  onSectionChange={onSectionChange}
                  depth={depth + 1}
                  appearance={appearance}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
