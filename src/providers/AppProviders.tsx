"use client";

import { Suspense } from "react";
import LoadingScreen from "@/components/loaders/LoadingScreen";
import ModalHost from "@/components/modals/ModalHost";
import ToastHost from "@/components/toast/ToastHost";
import AuthHydrator from "@/providers/AuthHydrator";
import { QueryProvider } from "@/providers/QueryProvider";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <AuthHydrator />
      <Suspense fallback={null}>
        <LoadingScreen />
      </Suspense>
      {children}
      <ToastHost />
      <ModalHost />
    </QueryProvider>
  );
}
