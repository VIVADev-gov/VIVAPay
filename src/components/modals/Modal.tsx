"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, X } from "lucide-react";
import React, { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import logger from "@/lib/logger";

type Tamaño = "sm" | "md" | "lg" | "xl" | "full" | "fullscreen";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  tamaño?: Tamaño;
  children: ReactNode;
  canClose?: boolean;
}

const tamañosMap: Record<Tamaño, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[90vw]",
  fullscreen: "w-[95vw] h-[95vh]",
};

const HEADER_HEIGHT = "4.5rem";

export default function Modal({
  isOpen,
  onClose,
  title = "",
  tamaño = "lg",
  children,
  canClose = true,
}: ModalProps) {
  const isFullscreen = tamaño === "fullscreen";

  useEffect(() => {
    if (isOpen) {
      logger.debug("[Modal] abierto", { title, tamaño });
    }
  }, [isOpen, title, tamaño]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && canClose) {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, canClose, onClose]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-99998"
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="presentation"
            className={`fixed inset-0 z-99999 flex items-center justify-center bg-foreground/40 backdrop-blur-sm ${
              isFullscreen ? "p-2" : "p-4"
            } ${!canClose ? "cursor-not-allowed" : ""}`}
            onClick={canClose ? onClose : (e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? "modal-title" : undefined}
              className={`
                relative w-full overflow-hidden border border-border/70 bg-popover text-popover-foreground shadow-xl
                ${isFullscreen ? "h-[95vh] rounded-none" : "max-h-[95vh] rounded-2xl"}
                ${tamañosMap[tamaño] ?? tamañosMap.md}
              `}
              onClick={(e) => e.stopPropagation()}
            >
              <header
                className={`sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-popover/95 px-5 py-4 backdrop-blur-sm ${
                  isFullscreen ? "" : "rounded-t-2xl"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                    <LayoutGrid className="h-5 w-5" aria-hidden="true" />
                  </div>
                  {title ? (
                    <div className="min-w-0">
                      <h2
                        id="modal-title"
                        className="truncate text-lg font-semibold tracking-tight text-foreground"
                      >
                        {title}
                      </h2>
                    </div>
                  ) : null}
                </div>

                {canClose ? (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar modal"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover"
                  >
                    <X size={20} />
                  </button>
                ) : (
                  <div
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center"
                    aria-label="Procesando"
                  >
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
                  </div>
                )}
              </header>

              <div
                className={`overflow-y-auto bg-linear-to-b from-background to-card/40 ${
                  isFullscreen ? "p-8" : "p-6"
                }`}
                style={{
                  maxHeight: isFullscreen
                    ? `calc(95vh - ${HEADER_HEIGHT})`
                    : `calc(95vh - ${HEADER_HEIGHT})`,
                }}
              >
                {children}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
