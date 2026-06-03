"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PaymentAccountsTable from "@/components/cuentas-cobro/PaymentAccountsTable";
import ContractDetailPanel from "@/components/contratos/ContractDetailPanel";
import ContractHero from "@/components/contratos/ContractHero";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import EmptyState from "@/components/ui/EmptyState";
import { useContratoDetailQuery } from "@/hooks/api/useContratos";
import { useCuentasCobroSummaryQuery } from "@/hooks/api/useCuentasCobro";
import {
  canSubmitPaymentAccount,
  getPaymentAccountHref,
} from "@/lib/cuentas-cobro/paymentAccountAccess";
import { useContratosStore } from "@/store/contratos/contratos.store";
import { useCuentasCobroStore } from "@/store/cuentas-cobro/cuentas-cobro.store";
import { formatDate } from "@/utils/formatters";

export default function ContractDetailPage() {
  const params = useParams<{ id: string }>();
  const contractId = params.id;
  const detailQuery = useContratoDetailQuery(contractId);
  useCuentasCobroSummaryQuery();

  const detail = useContratosStore((s) => s.detail);
  const detailError = useContratosStore((s) => s.detailError);
  const isLoadingDetail = useContratosStore((s) => s.isLoadingDetail);
  const nextPayment = useCuentasCobroStore((s) => s.nextPaymentAccount);

  const contract = detail?.contract ?? null;
  const paymentAccounts = detail?.paymentAccounts ?? [];

  const nextForThisContract =
    nextPayment?.contratoId === contractId ? nextPayment : null;

  const highlightNumero = nextForThisContract?.numero ?? null;

  return (
    <DashboardLayout title="Detalle contractual">
      <section className="grid gap-8">
        <div className="flex">
          <Link
            href="/dashboard/contrato"
            className="rounded-full bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
          >
            Volver a contratos
          </Link>
        </div>

        <ContractHero contract={contract} title="Detalle del contrato" />

        {nextForThisContract ? (
          <section className="flex flex-col gap-4 rounded-4xl border border-ring/25 bg-linear-to-br from-card via-background to-ring/10 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-ring">
                Cuenta disponible
              </p>
              <h3 className="mt-2 text-lg font-black text-foreground">
                Cuenta No. {nextForThisContract.numero}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {canSubmitPaymentAccount(nextForThisContract)
                  ? "Puedes gestionar el envío desde el detalle de esta cuenta."
                  : `Disponible desde ${formatDate(nextForThisContract.fechaHabilitadaEnvio)}.`}
              </p>
            </div>
            <Link
              href={getPaymentAccountHref(contractId, nextForThisContract.numero)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-ring"
            >
              Gestionar cuenta
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </section>
        ) : null}

        {isLoadingDetail ? (
          <section className="rounded-4xl border border-border bg-background/70 p-6 shadow-sm">
            <EmptyState
              message="Cargando detalle"
              description="Obteniendo información completa del contrato."
              showRefreshButton={false}
              icon="refresh"
            />
          </section>
        ) : contract ? (
          <>
            <ContractDetailPanel contract={contract} />

            <section className="rounded-4xl border border-border bg-background/70 p-6 shadow-sm">
              <div className="mb-5">
                <h3 className="text-xl font-black text-foreground">
                  Historial de cuentas de cobro
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {paymentAccounts.length} cuenta(s) relacionada(s) con este
                  contrato. Selecciona una para ver el detalle o gestionar el
                  envío.
                </p>
              </div>
              <PaymentAccountsTable
                contractId={contractId}
                paymentAccounts={paymentAccounts}
                loading={isLoadingDetail}
                onRefresh={() => detailQuery.refetch()}
                highlightNumero={highlightNumero}
              />
            </section>
          </>
        ) : (
          <EmptyState
            message="Contrato no encontrado"
            description={detailError ?? "No fue posible cargar este contrato."}
            variant="error"
            icon="alert"
            onRefresh={() => detailQuery.refetch()}
          />
        )}
      </section>
    </DashboardLayout>
  );
}
