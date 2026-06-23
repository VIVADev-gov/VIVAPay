"use client";

import { useState } from "react";
import { ArrowUpRight, ClipboardList, Pencil, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ActionButton from "@/components/buttons/ActionButton";
import FileLink from "@/components/files/FileLink";
import PaymentAccountsTable from "@/components/cuentas-cobro/PaymentAccountsTable";
import ContractDetailPanel from "@/components/contratos/ContractDetailPanel";
import ContractEditModal from "@/components/contratos/ContractEditModal";
import ContractManualRegularizationModal from "@/components/contratos/ContractManualRegularizationModal";
import ContractHero from "@/components/contratos/ContractHero";
import RoleDashboardLayout from "@/components/layouts/RoleDashboardLayout";
import { USER_ROLES } from "@/constants/userRoles";
import EmptyState from "@/components/ui/EmptyState";
import {
  useContratoDetailQuery,
  useRegenerateContratoPaymentAccountsMutation,
} from "@/hooks/api/useContratos";
import {
  useContratoDocumentsQuery,
  useCuentasCobroSummaryQuery,
} from "@/hooks/api/useCuentasCobro";
import {
  canSubmitPaymentAccount,
  getPaymentAccountHref,
} from "@/lib/cuentas-cobro/paymentAccountAccess";
import { useContratosStore } from "@/store/contratos/contratos.store";
import { useCuentasCobroStore } from "@/store/cuentas-cobro/cuentas-cobro.store";
import { useUiStore } from "@/store/ui/ui-store";
import { formatDate } from "@/utils/formatters";

export default function ContractDetailPage() {
  const params = useParams<{ id: string }>();
  const contractId = params.id;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isManualRegularizationOpen, setIsManualRegularizationOpen] =
    useState(false);
  const detailQuery = useContratoDetailQuery(contractId);
  const regenerateMutation =
    useRegenerateContratoPaymentAccountsMutation(contractId);
  const documentsQuery = useContratoDocumentsQuery(contractId);
  useCuentasCobroSummaryQuery();

  const showToast = useUiStore((s) => s.showToast);
  const detail = useContratosStore((s) => s.detail);
  const detailError = useContratosStore((s) => s.detailError);
  const isLoadingDetail = useContratosStore((s) => s.isLoadingDetail);
  const nextPayment = useCuentasCobroStore((s) => s.nextPaymentAccount);

  const contract = detail?.contract ?? null;
  const paymentAccounts = detail?.paymentAccounts ?? [];
  const contractDocuments = documentsQuery.data?.documents ?? [];

  const nextForThisContract =
    nextPayment?.contratoId === contractId ? nextPayment : null;

  const highlightNumero = nextForThisContract?.numero ?? null;
  const hasManualPaymentAccounts = paymentAccounts.some(
    (account) => account.envioManual
  );

  const handleRegeneratePaymentAccounts = async () => {
    try {
      const result = await regenerateMutation.mutateAsync();
      showToast({
        message: `Cuentas regeneradas. Se generaron ${result.paymentAccounts.length} cuentas de cobro.`,
        variant: "success",
      });
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : "No se pudieron regenerar las cuentas",
        variant: "error",
      });
    }
  };

  return (
    <RoleDashboardLayout
      allowedRole={USER_ROLES.CONTRATISTA}
      title="Detalle contractual"
    >
      <section className="grid gap-8">
        <div className="flex">
          <Link
            href="/dashboard/contratista/contrato"
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
            <div className="flex justify-end">
              <ActionButton
                type="button"
                variant="outline"
                label="Editar contrato"
                icon={Pencil}
                onClick={() => setIsEditOpen(true)}
                className="w-full md:w-auto"
              />
            </div>

            <ContractDetailPanel />

            <ContractEditModal
              isOpen={isEditOpen}
              onClose={() => setIsEditOpen(false)}
              contractId={contractId}
              paymentAccounts={paymentAccounts}
            />

            <ContractManualRegularizationModal
              isOpen={isManualRegularizationOpen}
              onClose={() => setIsManualRegularizationOpen(false)}
              contractId={contractId}
              paymentAccounts={paymentAccounts}
            />

            <section className="rounded-4xl border border-border bg-background/70 p-6 shadow-sm">
              <div className="mb-5">
                <h3 className="text-xl font-black text-foreground">
                  Documentos reutilizables del contrato
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Archivos base cargados al crear el contrato. Se reutilizan en
                  el paquete de la primera, última o única cuenta de cobro.
                </p>
              </div>

              {contractDocuments.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {contractDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="rounded-2xl border border-border/70 bg-muted/30 p-4"
                    >
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {document.tipoDocumento}
                      </p>
                      <FileLink
                        url={document.filePath}
                        displayName={
                          document.originalName ?? document.tipoDocumento
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  Aún no hay documentos reutilizables cargados para este
                  contrato.
                </p>
              )}
            </section>

            <section className="rounded-4xl border border-border bg-background/70 p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-xl font-black text-foreground">
                    Historial de cuentas de cobro
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {paymentAccounts.length} cuenta(s) relacionada(s) con este
                    contrato. Selecciona una para ver el detalle o gestionar el
                    envío.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
                  {hasManualPaymentAccounts ? (
                    <ActionButton
                      type="button"
                      variant="outline"
                      label="Editar cuentas enviadas manualmente"
                      icon={ClipboardList}
                      onClick={() => setIsManualRegularizationOpen(true)}
                      className="w-full md:w-auto"
                    />
                  ) : null}
                  <ActionButton
                    type="button"
                    variant="outline"
                    label="Recalcular cuentas"
                    icon={RefreshCw}
                    loading={regenerateMutation.isPending}
                    onClick={handleRegeneratePaymentAccounts}
                    className="w-full md:w-auto"
                  />
                </div>
              </div>
              <PaymentAccountsTable
                contractId={contractId}
                paymentAccounts={paymentAccounts}
                loading={isLoadingDetail}
                onRefresh={() => detailQuery.refetch()}
                highlightNumero={highlightNumero}
                contractRequiresReembolsables={contract.tieneReembolsables}
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
    </RoleDashboardLayout>
  );
}
