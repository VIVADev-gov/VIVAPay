"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PaymentAccountWorkspace } from "@/components/cuentas-cobro";
import RoleDashboardLayout from "@/components/layouts/RoleDashboardLayout";
import EmptyState from "@/components/ui/EmptyState";
import { USER_ROLES } from "@/constants/userRoles";
import { useContratoDetailQuery } from "@/hooks/api/useContratos";
import { getContractDetailHref } from "@/lib/cuentas-cobro/paymentAccountAccess";
import { useContratosStore } from "@/store/contratos/contratos.store";

export default function PaymentAccountPage() {
  const params = useParams<{ id: string; numero: string }>();
  const contractId = params.id;
  const accountNumber = Number(params.numero);
  const detailQuery = useContratoDetailQuery(contractId);
  const detail = useContratosStore((s) => s.detail);
  const detailError = useContratosStore((s) => s.detailError);
  const isLoadingDetail = useContratosStore((s) => s.isLoadingDetail);

  const contract = detail?.contract ?? null;
  const paymentAccount =
    detail?.paymentAccounts.find((account) => account.numero === accountNumber) ??
    null;

  const contractDetailHref = getContractDetailHref(contractId);

  return (
    <RoleDashboardLayout
      allowedRole={USER_ROLES.CONTRATISTA}
      title={`Cuenta de cobro ${params.numero}`}
    >
      <section className="grid gap-8">
        <div className="flex flex-wrap gap-3">
          <Link
            href={contractDetailHref}
            className="rounded-full bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
          >
            Volver al contrato
          </Link>
          <Link
            href="/dashboard/contratista/contrato"
            className="rounded-full bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
          >
            Todos los contratos
          </Link>
        </div>

        {isLoadingDetail ? (
          <section className="rounded-4xl border border-border bg-background/70 p-6 shadow-sm">
            <EmptyState
              message="Cargando cuenta de cobro"
              description="Obteniendo información del contrato y la cuenta."
              showRefreshButton={false}
              icon="refresh"
            />
          </section>
        ) : contract && paymentAccount ? (
          <PaymentAccountWorkspace
            contract={contract}
            paymentAccount={paymentAccount}
            paymentAccounts={detail?.paymentAccounts ?? []}
          />
        ) : (
          <EmptyState
            message="Cuenta no encontrada"
            description={
              detailError ??
              (Number.isNaN(accountNumber)
                ? "El número de cuenta no es válido."
                : `No existe la cuenta No. ${params.numero} en este contrato.`)
            }
            variant="error"
            icon="alert"
            onRefresh={() => detailQuery.refetch()}
          />
        )}
      </section>
    </RoleDashboardLayout>
  );
}
