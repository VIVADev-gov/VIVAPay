"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import PaymentAccountsTable from "@/components/cuentas-cobro/PaymentAccountsTable";
import ContractDetailPanel from "@/components/contratos/ContractDetailPanel";
import ContractHero from "@/components/contratos/ContractHero";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import EmptyState from "@/components/ui/EmptyState";
import { useContratoDetailQuery } from "@/hooks/api/useContratos";
import { useContratosStore } from "@/store/contratos/contratos.store";

export default function ContractDetailPage() {
  const params = useParams<{ id: string }>();
  const contractId = params.id;
  const detailQuery = useContratoDetailQuery(contractId);
  const detail = useContratosStore((s) => s.detail);
  const detailError = useContratosStore((s) => s.detailError);
  const isLoadingDetail = useContratosStore((s) => s.isLoadingDetail);

  const contract = detail?.contract ?? null;
  const paymentAccounts = detail?.paymentAccounts ?? [];

  return (
    <DashboardLayout title="Detalle contractual">
      <section className="grid gap-8">
        <div className="flex">
          <Link
            href="/dashboard/informacion-contractual"
            className="rounded-full bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
          >
            Volver a contratos
          </Link>
        </div>

        <ContractHero contract={contract} title="Detalle del contrato" />

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
                  contrato.
                </p>
              </div>
              <PaymentAccountsTable
                paymentAccounts={paymentAccounts}
                loading={isLoadingDetail}
                onRefresh={() => detailQuery.refetch()}
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
