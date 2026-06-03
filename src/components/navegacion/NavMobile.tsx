"use client";

import Image from "next/image";
import React, { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ChevronDown, LogOut, Menu, X, Bell } from "lucide-react";
import Link from "next/link";
import { Badge } from "./NavigationItem";
import ActionButton from "@/components/buttons/ActionButton";
import type { NavMenuItem } from "./navigation.types";

type MobileHeaderProps = {
  onMenuToggle: () => void;
};

export const MobileHeader = ({ onMenuToggle }: MobileHeaderProps) => (
  <motion.div
    className="sticky top-0 z-30 flex w-full items-center justify-between border-b border-white/10 bg-[#262b31] p-4 text-white shadow-sm md:hidden"
    initial={{ y: -100 }}
    animate={{ y: 0 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
  >
    <div className="flex items-center gap-2">
      <img
        src="/logos/isotipo-automerco_naranja.png"
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 object-contain"
      />
      <img
        src="/logos/logo-automerco_white.png"
        alt="automerco"
        width={120}
        height={26}
        className="h-5 w-auto max-w-26 object-contain"
      />
    </div>
    <div className="flex items-center space-x-3">
      <motion.button
        type="button"
        className="relative rounded-xl border border-white/15 bg-white/5 p-2.5 text-white/80 shadow-sm transition-colors hover:bg-white/10 hover:text-white"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bell className="h-5 w-5" />
        <motion.span
        className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-primary shadow-sm"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.button>
      <motion.button
        type="button"
        onClick={onMenuToggle}
        className="rounded-xl bg-primary p-2.5 text-primary-foreground shadow-md transition-colors hover:bg-primary/92"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Menu className="h-6 w-6" />
      </motion.button>
    </div>
  </motion.div>
);

type MobileMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  menuItems: NavMenuItem[];
  activeSection: string;
  onSectionChange: (id: string) => void;
  onLogout: () => void;
};

export const MobileMenu = ({
  isOpen,
  onClose,
  menuItems,
  activeSection,
  onSectionChange,
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

  const renderMenuItem = (item: NavMenuItem, isSubmenu = false, index = 0): React.ReactNode => {
    const hasSubmenu = Boolean(item.submenu && item.submenu.length > 0);

    const handleItemClick = () => {
      if (hasSubmenu) {
        toggleSubmenu(item.id);
      } else {
        onSectionChange(item.id);
        onClose();
      }
    };

    const itemVariants: Variants = {
      hidden: { opacity: 0, x: -30 },
      visible: {
        opacity: 1,
        x: 0,
        transition: {
          duration: 0.2,
          delay: index * 0.05,
          ease: "easeOut",
        },
      },
    };

    const itemContent = (
      <>
        <div className="flex items-center">
          <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.1 }}>
            {React.cloneElement(item.icon, {
              className: `mr-3 shrink-0 ${isSubmenu ? "h-4 w-4" : "h-5 w-5"} ${
                activeSection === item.id ? "text-primary-foreground" : "text-white/65"
              }`,
            })}
          </motion.div>
          <span
            className={`font-semibold ${isSubmenu ? "text-base" : "text-lg"} ${
              activeSection === item.id ? "" : "text-white/95"
            }`}
          >
            {item.label}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {item.badge != null && (
            <Badge variant={item.badgeVariant ?? "default"} active={activeSection === item.id}>
              {item.badge}
            </Badge>
          )}
          {hasSubmenu && (
            <motion.div
              animate={{ rotate: expandedItems.has(item.id) ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown
                className={`h-4 w-4 ${activeSection === item.id ? "text-primary-foreground" : "text-white/50"}`}
              />
            </motion.div>
          )}
        </div>
      </>
    );

    const containerClass = `flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left ${
      isSubmenu ? "ml-3 border-l-2 border-white/15 pl-3" : ""
    } ${
      activeSection === item.id
        ? "bg-primary text-primary-foreground shadow-md"
        : "text-white/95 hover:bg-white/[0.07]"
    }`;

    return (
      <motion.div key={item.id} variants={itemVariants} initial="hidden" animate="visible">
        <motion.div
          className={containerClass}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleItemClick}
        >
          {hasSubmenu ? (
            itemContent
          ) : (
            <Link
              href={item.path ?? "/dashboard"}
              className="w-full flex items-center justify-between"
            >
              {itemContent}
            </Link>
          )}
        </motion.div>

        <AnimatePresence>
          {hasSubmenu && expandedItems.has(item.id) && (
            <motion.div
              className="mt-2 space-y-1"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {item.submenu!.map((subItem, subIndex) => renderMenuItem(subItem, true, subIndex))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col border-r border-white/10 bg-[#262b31] text-white shadow-2xl"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <motion.div
              className="relative border-b border-white/10 bg-[#262b31] px-4 pb-5 pt-4"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 }}
            >
              <motion.button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 rounded-xl border border-white/20 bg-white/5 p-2 text-white transition-colors hover:bg-white/10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="h-5 w-5" />
              </motion.button>
              <div className="flex flex-col items-center gap-2 pr-2 pt-1">
                <img
                  src="/logos/isotipo-automerco_naranja.png"
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 shrink-0 object-contain"
                />
                <img
                  src="/logos/logo-automerco_white.png"
                  alt="automerco"
                  width={152}
                  height={30}
                  className="h-auto w-[min(100%,9.5rem)] object-contain"
                />
              </div>
            </motion.div>

            <nav
              className="scrollbar-thin flex-1 overflow-y-auto px-3 py-5"
              style={{ scrollbarColor: "rgba(255,255,255,0.2) transparent" }}
            >
              <div className="space-y-2">
                {menuItems.map((item, index) => renderMenuItem(item, false, index))}
              </div>
            </nav>

            <motion.div
              className="border-t border-white/10 bg-[#1f2329] p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <ActionButton
                  variant="outline"
                  className="w-full border-white/20 text-white hover:border-white/35 hover:bg-white/10 hover:text-white"
                  icon={LogOut}
                  label="Cerrar sesión"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

type NavMobileProps = {
  menuItems: NavMenuItem[];
  handleSectionChange: (id: string) => void;
  getActiveSection: string;
  handleLogout: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
};

export default function NavMobile({
  menuItems,
  handleSectionChange,
  getActiveSection,
  handleLogout,
  mobileMenuOpen,
  setMobileMenuOpen,
}: NavMobileProps) {
  return (
    <>
      <MobileHeader onMenuToggle={() => setMobileMenuOpen(true)} />
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        menuItems={menuItems}
        activeSection={getActiveSection}
        onSectionChange={handleSectionChange}
        onLogout={handleLogout}
      />
    </>
  );
}
