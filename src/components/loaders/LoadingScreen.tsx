"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { LIGHT_THEME } from "@/constants/theme";
import { useUiStore } from "@/store/ui/ui-store";

const LOGO_SRC = "/logoviva.png";

/** Mínimo visible para que el overlay no parpadee en transiciones muy rápidas. */
const ROUTE_LOADING_MIN_MS = 320;

function scheduleHideLoading(hideLoading: () => void) {
  return window.setTimeout(() => hideLoading(), ROUTE_LOADING_MIN_MS);
}

/**
 * Activa el loading global al cargar/recargar la app y en cada cambio de ruta
 * (pathname o query). Debe montarse bajo `<Suspense>` por `useSearchParams`.
 */
function RouteLoadingController() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const showLoading = useUiStore((s) => s.showLoading);
  const hideLoading = useUiStore((s) => s.hideLoading);
  const routeKeyRef = useRef<string | null>(null);
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    if (initialLoadDoneRef.current) return;
    initialLoadDoneRef.current = true;

    showLoading();

    const finish = () => scheduleHideLoading(hideLoading);

    if (document.readyState === "complete") {
      finish();
      return;
    }

    window.addEventListener("load", finish, { once: true });
    return () => window.removeEventListener("load", finish);
  }, [showLoading, hideLoading]);

  useEffect(() => {
    const key = `${pathname}${queryString ? `?${queryString}` : ""}`;

    if (routeKeyRef.current === null) {
      routeKeyRef.current = key;
      return;
    }

    if (routeKeyRef.current === key) return;

    routeKeyRef.current = key;
    showLoading();
    const id = scheduleHideLoading(hideLoading);
    return () => window.clearTimeout(id);
  }, [pathname, queryString, showLoading, hideLoading]);

  return null;
}

export default function LoadingScreen() {
  const isLoading = useUiStore((s) => s.isLoading);

  return (
    <>
      <RouteLoadingController />
      {isLoading ? <LoadingScreenOverlay /> : null}
    </>
  );
}

function LoadingScreenOverlay() {
  const progress = useUiStore((s) => s.loadingProgress);
  const message = useUiStore((s) => s.loadingMessage);

  const isDeterminate =
    typeof progress === "number" &&
    !Number.isNaN(progress) &&
    progress >= 0 &&
    progress <= 100;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-8 px-6"
      style={{ backgroundColor: LIGHT_THEME.colors.foreground }}
    >
      <div className="flex flex-col items-center gap-6">
        <Image
          src={LOGO_SRC}
          alt="Vivapay"
          width={120}
          height={120}
          className="h-auto w-[min(28vw,7.5rem)] object-contain"
          priority
        />

        <div className="w-[min(18rem,85vw)]">
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-white/15">
            {isDeterminate ? (
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            ) : (
              <motion.div
                className="absolute inset-y-0 w-1/3 rounded-full bg-primary"
                initial={{ left: "-33.333%" }}
                animate={{ left: ["-33.333%", "100%"] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </div>
          {message ? (
            <p className="mt-3 text-center text-sm text-white/80">{message}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
