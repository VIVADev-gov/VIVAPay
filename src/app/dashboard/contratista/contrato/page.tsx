"use client";

import { CalendarDays, FileText } from "lucide-react";
import Modal from "@/components/modals/Modal";
import { DashboardHero } from "@/components/dashboard";
import {
  ContractCreateForm,
  ContractsTable,
  ModuleCreateButton,
} from "@/components/contratos";
import RoleDashboardLayout from "@/components/layouts/RoleDashboardLayout";
import { USER_ROLES } from "@/constants/userRoles";
import EmptyState from "@/components/ui/EmptyState";
import { useContratosQuery } from "@/hooks/api/useContratos";
import { useContratosStore } from "@/store/contratos/contratos.store";
import { formatCurrency, formatDate } from "@/utils/formatters";

export default function InformacionContractualPage() {
  const contratosQuery = useContratosQuery();
  const contracts = useContratosStore((s) => s.contracts);
  const currentContract = useContratosStore((s) => s.currentContract);
  const lastContract = useContratosStore((s) => s.lastContract);
  const listError = useContratosStore((s) => s.listError);
  const isCreateModalOpen = useContratosStore((s) => s.isCreateModalOpen);
  const openCreateModal = useContratosStore((s) => s.openCreateModal);
  const closeCreateModal = useContratosStore((s) => s.closeCreateModal);

  const heroContract = currentContract ?? lastContract;
  const current = heroContract?.actual;

  return (
    <RoleDashboardLayout
      allowedRole={USER_ROLES.CONTRATISTA}
      title="Información contractual"
    >
      <section className="grid gap-8">
        <DashboardHero
          eyebrow="Información contractual"
          title={
            heroContract
              ? `Contrato No. ${current?.numeroContrato ?? heroContract.numeroContrato}`
              : "Sin contratos registrados"
          }
          description={
            heroContract
              ? "Gestiona tu contrato vigente o histórico, revisa el detalle completo y el historial de cuentas de cobro asociadas."
              : "Cuando registres un contrato, aparecerá aquí como referencia principal de tu información contractual."
          }
        >
          {heroContract ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <CalendarDays className="mb-2 h-4 w-4" />
                <p className="text-[10px] font-bold uppercase tracking-wide text-primary-foreground/70">
                  Fecha final
                </p>
                <p className="mt-1 text-sm font-bold">
                  {formatDate(current?.fechaFinal ?? heroContract.fechaFinal)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <FileText className="mb-2 h-4 w-4" />
                <p className="text-[10px] font-bold uppercase tracking-wide text-primary-foreground/70">
                  Plazo
                </p>
                <p className="mt-1 text-sm font-bold">
                  {current?.plazoMeses ?? heroContract.plazoMeses} meses
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-primary-foreground/70">
                  Recursos
                </p>
                <p className="mt-1 text-sm font-bold">
                  {formatCurrency(current?.totalRecursosComprometidos)}
                </p>
              </div>
            </div>
          ) : null}
        </DashboardHero>

        <section className="overflow-hidden rounded-4xl border border-border/80 bg-linear-to-br from-card via-background to-muted/20 p-6 shadow-sm md:p-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Historial
              </p>
              <h3 className="mt-2 text-xl font-black text-foreground">
                Contratos registrados
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Consulta todos tus contratos. En el detalle verás el objeto
                completo y el historial de cobros.
              </p>
            </div>
            <ModuleCreateButton label="Crear contrato" onClick={openCreateModal} />
          </div>

          {listError ? (
            <EmptyState
              message="No se pudieron cargar los contratos"
              description={listError}
              variant="error"
              icon="alert"
              onRefresh={() => contratosQuery.refetch()}
            />
          ) : (
            <ContractsTable
              contracts={contracts}
              loading={contratosQuery.isLoading}
              onRefresh={() => contratosQuery.refetch()}
            />
          )}
        </section>
      </section>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        title="Crear contrato"
        tamaño="xl"
      >
        <ContractCreateForm
          onSuccess={closeCreateModal}
          onCancel={closeCreateModal}
        />
      </Modal>
    </RoleDashboardLayout>
  );
}
