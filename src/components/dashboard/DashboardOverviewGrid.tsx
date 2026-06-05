"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { useContratosQuery } from "@/hooks/api/useContratos";
import { useCuentasCobroSummaryQuery } from "@/hooks/api/useCuentasCobro";
import { useContratosStore } from "@/store/contratos/contratos.store";
import { useCuentasCobroStore } from "@/store/cuentas-cobro/cuentas-cobro.store";
import {
  getPaymentAccountActionLabel,
  getPaymentAccountHref,
} from "@/lib/cuentas-cobro/paymentAccountAccess";
import type { CuentaCobroStatus } from "@/types/contratos";
import { formatCurrency, formatDate } from "@/utils/formatters";

function OverviewStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "primary" | "accent";
}) {
  const toneClasses = {
    neutral: "border-border/60 bg-background/80",
    primary: "border-primary/20 bg-primary/5",
    accent: "border-accent/25 bg-accent/5",
  };

  const valueClasses = {
    neutral: "text-foreground",
    primary: "text-primary",
    accent: "text-accent",
  };

  return (
    <div
      className={`rounded-2xl border p-3 backdrop-blur-sm ${toneClasses[tone]}`}
    >
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-sm font-semibold ${valueClasses[tone]}`}>
        {value}
      </p>
    </div>
  );
}

const PAYMENT_STATUS_LABELS: Record<CuentaCobroStatus, string> = {
  BORRADOR: "Borrador",
  PENDIENTE: "Pendiente",
  HABILITADA: "Habilitada",
  ENVIADA: "Enviada",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
};

const PAYMENT_STATUS_STYLES: Record<CuentaCobroStatus, string> = {
  BORRADOR: "border-border bg-muted text-muted-foreground",
  PENDIENTE: "border-accent/30 bg-accent/10 text-accent",
  HABILITADA: "border-primary/30 bg-primary/10 text-primary",
  ENVIADA: "border-ring/30 bg-ring/10 text-ring",
  APROBADA: "border-primary/30 bg-primary/15 text-primary",
  RECHAZADA: "border-destructive/30 bg-destructive/10 text-destructive",
};

function PaymentStatusBadge({ estado }: { estado: CuentaCobroStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${PAYMENT_STATUS_STYLES[estado]}`}
    >
      {PAYMENT_STATUS_LABELS[estado]}
    </span>
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

  const contractNumber =
    contract?.actual.numeroContrato ?? contract?.numeroContrato;

  return (
    <section className="grid gap-5">
      <div className="grid gap-3 lg:grid-cols-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
          Marco contractual
        </p>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Cobro del periodo
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <article className="group relative overflow-hidden rounded-3xl border border-primary/25 border-l-4 border-l-primary bg-linear-to-br from-card via-background to-primary/8 p-6 shadow-sm transition hover:shadow-lg">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
              Contrato
            </span>
          </div>

          <div className="relative mt-4">

            {isLoading ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Cargando contrato...
              </p>
            ) : contract ? (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-black tracking-tight text-foreground">
                    No. {contractNumber}
                  </h3>
                  {contract.vigente ? (
                    <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">
                      Vigente
                    </span>
                  ) : null}
                </div>

                {contract.objeto ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {contract.objeto}
                  </p>
                ) : null}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <OverviewStat
                    label="Inicio"
                    value={formatDate(
                      contract.actual.fechaActaInicio ?? contract.fechaActaInicio
                    )}
                  />
                  <OverviewStat
                    label="Fecha final"
                    value={formatDate(
                      contract.actual.fechaFinal ?? contract.fechaFinal
                    )}
                  />
                  <OverviewStat
                    label="Valor total"
                    value={formatCurrency(
                      contract.actual.totalRecursosComprometidos
                    )}
                    tone="primary"
                  />
                  <OverviewStat
                    label="Cuentas de cobro"
                    value={String(contract.paymentAccountCount ?? 0)}
                  />
                </div>

                <Link
                  href={`${basePath}/contrato/${contract.id}`}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-border bg-primary/80 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:border-primary/40 hover:bg-primary"
                >
                  Ver contrato
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Aún no tienes contratos registrados en Vivapay.
              </p>
            )}
          </div>
        </article>

        <article className="group relative overflow-hidden rounded-3xl border border-accent/25 border-l-4 border-l-accent bg-linear-to-br from-card via-background to-accent/8 p-6 shadow-sm transition hover:shadow-lg">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/10" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent shadow-sm">
              {completedAll ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Receipt className="h-5 w-5" />
              )}
            </div>
            <span className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-accent">
              Cuenta de cobro
            </span>
          </div>

          <div className="relative mt-4">
            {isLoading ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Cargando cuenta...
              </p>
            ) : completedAll ? (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-black tracking-tight text-foreground">
                    Ciclo completado
                  </h3>
                  <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">
                    Finalizado
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {summaryMessage}
                </p>
                {contractNumber ? (
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Contrato No. {contractNumber}
                  </p>
                ) : null}
              </>
            ) : nextPayment ? (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-black tracking-tight text-foreground">
                    Cuenta No. {nextPayment.numero}
                  </h3>
                  <PaymentStatusBadge estado={nextPayment.estado} />
                </div>

                {contractNumber ? (
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Del contrato No. {contractNumber}
                  </p>
                ) : null}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <OverviewStat
                    label="Periodo"
                    value={`${formatDate(nextPayment.periodoInicio)} – ${formatDate(nextPayment.periodoFin)}`}
                    tone="accent"
                  />
                  <OverviewStat
                    label="Valor"
                    value={formatCurrency(nextPayment.valor)}
                  />
                  <OverviewStat
                    label="Disponible desde"
                    value={formatDate(nextPayment.fechaHabilitadaEnvio)}
                  />
                  <OverviewStat
                    label="Plazo máximo"
                    value={formatDate(nextPayment.fechaLimiteEnvio)}
                    tone="accent"
                  />
                </div>

                <Link
                  href={getPaymentAccountHref(
                    nextPayment.contratoId,
                    nextPayment.numero
                  )}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground shadow-md transition hover:bg-accent/90"
                >
                  {getPaymentAccountActionLabel(nextPayment)}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-black tracking-tight text-foreground">
                    Sin cuentas pendientes
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {lastPayment
                    ? `La última cuenta registrada fue la No. ${lastPayment.numero}.`
                    : "Aún no hay cuentas de cobro registradas para tu usuario."}
                </p>
                {contractNumber ? (
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Contrato No. {contractNumber}
                  </p>
                ) : null}
              </>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
