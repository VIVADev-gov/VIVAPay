"use client";

import Image from "next/image";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";

import { NavigationItem } from "./NavigationItem";
import ActionButton from "@/components/buttons/ActionButton";
import type { NavMenuItem } from "./navigation.types";

const ISOTYPE_SRC = "/logos/isotipo-automerco_fondo blanco.png";
const WORDMARK_SRC = "/logos/logo-automerco_white.png";

type SidebarHeaderProps = {
  isExpanded: boolean;
};

export const SidebarHeader = ({ isExpanded }: SidebarHeaderProps) => (
  <div
    className={`relative border-b border-white/10 bg-[#262b31] ${isExpanded ? "px-4 py-6" : "px-2 py-5"}`}
  >
    <div className="flex flex-col items-center gap-3">
      <motion.div
        layout
        className="flex shrink-0 items-center justify-center"
        transition={{ duration: 0.25, ease: "easeInOut" }}
      >
        <Image
          src={ISOTYPE_SRC}
          alt="Automerco"
          width={60}
          height={60}
          className={`object-contain rounded-full ${isExpanded ? "h-18 w-18" : "h-14 w-14"}`}
          priority
        />
      </motion.div>
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            key="wordmark"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-39 px-1"
          >
            <Image
              src={WORDMARK_SRC}
              alt="automerco"
              width={156}
              height={32}
              className="h-auto w-full object-contain object-center"
              priority
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
);

type SidebarProps = {
  menuItems: NavMenuItem[];
  activeSection: string;
  onSectionChange: (id: string) => void;
  onLogout: () => void;
};

export const Sidebar = ({
  menuItems,
  activeSection,
  onSectionChange,
  onLogout,
}: SidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const sidebarVariants = {
    collapsed: { width: 80 },
    expanded: { width: 288 },
  };

  return (
    <motion.aside
      className="fixed left-0 top-0 z-50 hidden h-screen flex-col border-r border-white/10 bg-[#262b31] text-white shadow-[4px_0_24px_rgba(0,0,0,0.18)] md:flex"
      variants={sidebarVariants}
      animate={isExpanded ? "expanded" : "collapsed"}
      initial="collapsed"
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      layout
    >
      <SidebarHeader isExpanded={isExpanded} />

      <motion.nav
        className="scrollbar-thin flex-1 overflow-y-auto px-2 py-5"
        layout
        style={{ scrollbarColor: "rgba(255,255,255,0.2) transparent" }}
      >
        <div className={`space-y-1 flex flex-col ${isExpanded ? 'items-start' : 'items-center'}`}>
   
          {menuItems.map((item, groupIndex) =>
            item.submenu?.length ? (
              <div key={item.id} className="mb-3">
                {isExpanded ? (
                  <p
                    className={`mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45 ${
                      groupIndex === 0 ? "mt-0" : "mt-1"
                    }`}
                  >
                    {item.label}
                  </p>
                ) : (
                  <div
                    className="mx-auto mb-2 h-px w-9 bg-white/15"
                    aria-hidden
                  />
                )}
                <div className="space-y-0.5">
                  {item.submenu.map((sub, index) => (
                    <motion.div
                      key={sub.id}
                      initial={false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: index * 0.02 }}
                    >
                      <NavigationItem
                        item={sub}
                        isActive={activeSection === sub.id}
                        isExpanded={isExpanded}
                        activeSection={activeSection}
                        onSectionChange={onSectionChange}
                        appearance="darkSidebar"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <motion.div key={item.id} layout className="mb-1">
                <NavigationItem
                  item={item}
                  isActive={activeSection === item.id}
                  isExpanded={isExpanded}
                  activeSection={activeSection}
                  onSectionChange={onSectionChange}
                  appearance="darkSidebar"
                />
              </motion.div>
            ),
          )}
        </div>
      </motion.nav>

      <motion.div
        className="border-t border-white/10 bg-[#1f2329] p-3"
        layout
      >
        <ActionButton
          variant="outline"
          className={`w-full border-white/20 text-white hover:border-white/35 hover:bg-white/10 hover:text-white ${
            isExpanded ? "px-4" : "px-2"
          }`}
          icon={LogOut}
          label={isExpanded ? "Cerrar sesión" : null}
          onClick={onLogout}
        />
      </motion.div>
    </motion.aside>
  );
};

export default Sidebar;
