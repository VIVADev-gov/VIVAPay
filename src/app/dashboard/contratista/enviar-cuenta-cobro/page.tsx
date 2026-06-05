"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import RoleDashboardLayout from "@/components/layouts/RoleDashboardLayout";
import { USER_ROLES } from "@/constants/userRoles";
import { getContractDetailHref } from "@/lib/cuentas-cobro/paymentAccountAccess";
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
      router.replace(getContractDetailHref(summaryContract.id));
      return;
    }

    router.replace("/dashboard/contratista/contrato");
  }, [isLoading, nextPayment, summaryContract?.id, router]);

  return (
    <RoleDashboardLayout
      allowedRole={USER_ROLES.CONTRATISTA}
      title="Redirigiendo"
    >
      <EmptyState
        message="Redirigiendo"
        description="Las cuentas de cobro se gestionan desde el detalle del contrato."
        showRefreshButton={false}
        icon="refresh"
        variant="loading"
      />
    </RoleDashboardLayout>
  );
}
