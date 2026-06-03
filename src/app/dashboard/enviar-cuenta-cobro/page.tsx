"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import EmptyState from "@/components/ui/EmptyState";
import { useCuentasCobroSummaryQuery } from "@/hooks/api/useCuentasCobro";
import { getPaymentAccountHref } from "@/lib/cuentas-cobro/paymentAccountAccess";
import { useCuentasCobroStore } from "@/store/cuentas-cobro/cuentas-cobro.store";

/** Redirige al flujo por contrato (módulo enviar cuenta de cobro retirado). */
export default function EnviarCuentaCobroRedirectPage() {
  const router = useRouter();
  useCuentasCobroSummaryQuery();

  const nextPayment = useCuentasCobroStore((s) => s.nextPaymentAccount);
  const isLoading = useCuentasCobroStore((s) => s.isLoadingSummary);
  const summaryContract = useCuentasCobroStore((s) => s.currentContract);

  useEffect(() => {
    if (isLoading) return;

    if (nextPayment) {
      router.replace(
        getPaymentAccountHref(nextPayment.contratoId, nextPayment.numero)
      );
      return;
    }

    if (summaryContract?.id) {
      router.replace(`/dashboard/contrato/${summaryContract.id}`);
      return;
    }

    router.replace("/dashboard/contrato");
  }, [isLoading, nextPayment, summaryContract?.id, router]);

  return (
    <DashboardLayout title="Redirigiendo">
      <EmptyState
        message="Redirigiendo"
        description="Las cuentas de cobro se gestionan desde el detalle del contrato."
        showRefreshButton={false}
        icon="refresh"
        variant="loading"
      />
    </DashboardLayout>
  );
}
