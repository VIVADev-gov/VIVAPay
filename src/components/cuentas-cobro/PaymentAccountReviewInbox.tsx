"use client";

import Link from "next/link";
import { ArrowUpRight, ClipboardList } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { CUENTA_COBRO_STATUS_LABELS } from "@/constants/cuentaCobroWorkflow";
import { usePaymentAccountReviewListQuery } from "@/hooks/api/useCuentasCobro";
import { getPaymentAccountReviewHref } from "@/lib/cuentas-cobro/paymentAccountAccess";
import { formatCurrency, formatDate } from "@/utils/formatters";

type PaymentAccountReviewInboxProps = {
  roleBase: string;
};

export default function PaymentAccountReviewInbox({
  roleBase,
}: PaymentAccountReviewInboxProps) {
  const reviewQuery = usePaymentAccountReviewListQuery();
  const items = reviewQuery.data?.items ?? [];

  if (reviewQuery.isLoading) {
    return (
      <EmptyState
        message="Cargando bandeja"
        description="Obteniendo cuentas pendientes de revisión."
        showRefreshButton={false}
        icon="refresh"
        variant="loading"
      />
    );
  }

  if (reviewQuery.isError) {
    return (
      <EmptyState
        message="No se pudo cargar la bandeja"
        description={
          reviewQuery.error instanceof Error
            ? reviewQuery.error.message
            : "Intenta de nuevo."
        }
        variant="error"
        icon="alert"
        onRefresh={() => reviewQuery.refetch()}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        message="Sin cuentas pendientes"
        description="Cuando un contratista envíe una cuenta, aparecerá aquí para revisión."
        showRefreshButton={false}
        icon="inbox"
        variant="empty"
      />
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <article
          key={item.paymentAccount.id}
          className="rounded-3xl border border-border/80 bg-linear-to-br from-card via-background to-primary/5 p-5 shadow-sm"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  {item.contractor.name}
                </p>
                <h3 className="mt-1 text-lg font-black text-foreground">
                  Cuenta No. {item.paymentAccount.numero}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Contrato {item.contract.numeroContrato}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(item.paymentAccount.periodoInicio)} –{" "}
                  {formatDate(item.paymentAccount.periodoFin)} ·{" "}
                  {formatCurrency(item.paymentAccount.valor)}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 md:items-end">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {CUENTA_COBRO_STATUS_LABELS[item.paymentAccount.estado]}
              </span>
              <Link
                href={getPaymentAccountReviewHref(
                  roleBase,
                  item.contract.id,
                  item.paymentAccount.numero
                )}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:bg-ring"
              >
                Revisar
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
