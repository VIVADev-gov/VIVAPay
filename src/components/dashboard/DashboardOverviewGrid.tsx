"use client";

import { ArrowUpRight, CalendarClock, CheckCircle2, FileText } from "lucide-react";
import Link from "next/link";
import { useContratosQuery } from "@/hooks/api/useContratos";
import { useCuentasCobroSummaryQuery } from "@/hooks/api/useCuentasCobro";
import { useContratosStore } from "@/store/contratos/contratos.store";
import { useCuentasCobroStore } from "@/store/cuentas-cobro/cuentas-cobro.store";
import { getPaymentAccountHref } from "@/lib/cuentas-cobro/paymentAccountAccess";
import { formatCurrency, formatDate } from "@/utils/formatters";

function OverviewStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 p-3 backdrop-blur-sm">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

type DashboardOverviewGridProps = {
  basePath?: string;
};

export default function DashboardOverviewGrid({
  basePath = "/dashboard/contratista",
}: DashboardOverviewGridProps) {
  useContratosQuery();
  useCuentasCobroSummaryQuery();

  const currentContract = useContratosStore((s) => s.currentContract);
  const lastContract = useContratosStore((s) => s.lastContract);
  const contract = currentContract ?? lastContract;
  const nextPayment = useCuentasCobroStore((s) => s.nextPaymentAccount);
  const lastPayment = useCuentasCobroStore((s) => s.lastPaymentAccount);
  const completedAll = useCuentasCobroStore((s) => s.completedAllPaymentAccounts);
  const summaryMessage = useCuentasCobroStore((s) => s.summaryMessage);
  const isLoadingList = useContratosStore((s) => s.isLoadingList);
  const isLoadingSummary = useCuentasCobroStore((s) => s.isLoadingSummary);
  const isLoading = isLoadingList || isLoadingSummary;

  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <article className="group relative overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-br from-card via-background to-primary/10 p-6 shadow-sm transition hover:shadow-lg">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-sm">
            <FileText className="h-5 w-5" />
          </div>
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            Contrato
          </span>
        </div>

        {isLoading ? (
          <p className="relative mt-4 text-sm text-muted-foreground">
            Cargando contrato...
          </p>
        ) : contract ? (
          <div className="relative mt-4">
            <h3 className="text-xl font-black text-foreground">
              No. {contract.actual.numeroContrato ?? contract.numeroContrato}
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <OverviewStat
                label="Inicio"
                value={formatDate(
                  contract.actual.fechaActaInicio ?? contract.fechaActaInicio
                )}
              />
              <OverviewStat
                label="Fecha final"
                value={formatDate(contract.actual.fechaFinal ?? contract.fechaFinal)}
              />
              <OverviewStat
                label="Valor"
                value={formatCurrency(contract.actual.totalRecursosComprometidos)}
              />
              <OverviewStat
                label="Cuentas"
                value={String(contract.paymentAccountCount ?? 0)}
              />
            </div>
            <Link
              href={`${basePath}/contrato/${contract.id}`}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-ring"
            >
              Ver detalle
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <p className="relative mt-4 text-sm leading-6 text-muted-foreground">
            Aún no tienes contratos registrados en Vivapay.
          </p>
        )}
      </article>

      <article className="group relative overflow-hidden rounded-3xl border border-ring/20 bg-linear-to-br from-card via-background to-ring/10 p-6 shadow-sm transition hover:shadow-lg">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-ring/10" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ring/15 text-ring shadow-sm">
            {completedAll ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <CalendarClock className="h-5 w-5" />
            )}
          </div>
          <span className="rounded-full border border-ring/20 bg-ring/10 px-3 py-1 text-xs font-bold text-ring">
            Cuenta de cobro
          </span>
        </div>

        {isLoading ? (
          <p className="relative mt-4 text-sm text-muted-foreground">
            Cargando cuenta...
          </p>
        ) : completedAll ? (
          <div className="relative mt-4">
            <h3 className="text-xl font-black text-foreground">
              Todas las cuentas realizadas
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {summaryMessage}
            </p>
          </div>
        ) : nextPayment ? (
          <div className="relative mt-4">
            <h3 className="text-xl font-black text-foreground">
              Cuenta No. {nextPayment.numero}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Disponible desde {formatDate(nextPayment.fechaHabilitadaEnvio)}
              {nextPayment.fechaLimiteEnvio
                ? ` hasta ${formatDate(nextPayment.fechaLimiteEnvio)}`
                : "."}
            </p>
            <Link
              href={getPaymentAccountHref(
                nextPayment.contratoId,
                nextPayment.numero
              )}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-ring"
            >
              Gestionar cuenta
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="relative mt-4">
            <h3 className="text-xl font-black text-foreground">
              Sin cuentas pendientes
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {lastPayment
                ? `La última cuenta registrada fue la No. ${lastPayment.numero}.`
                : "Aún no hay cuentas de cobro registradas para tu usuario."}
            </p>
          </div>
        )}
      </article>
    </section>
  );
}
