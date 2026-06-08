"use client";

import Link from "next/link";
import { useState } from "react";
import ActionButton from "@/components/buttons/ActionButton";
import PaymentAccountDevolucionModal from "@/components/cuentas-cobro/PaymentAccountDevolucionModal";
import FileLink from "@/components/files/FileLink";
import EmptyState from "@/components/ui/EmptyState";
import {
  CUENTA_COBRO_STATUS_LABELS,
  CUENTA_COBRO_WORKFLOW_ACTION,
  isDirectorSigned,
} from "@/constants/cuentaCobroWorkflow";
import { USER_ROLES, type UserRole } from "@/constants/userRoles";
import {
  usePaymentAccountReviewDetailQuery,
  usePaymentAccountWorkflowMutation,
} from "@/hooks/api/useCuentasCobro";
import { useProfileQuery } from "@/hooks/api/useProfile";
import {
  canDirectorSign,
  canJefeApproveSend,
  canReturnToContractor,
  canSupervisorForwardDirector,
  canSupervisorSendCad,
} from "@/lib/cuentas-cobro/paymentAccountWorkflow";
import { hasUserSignature } from "@/lib/profile/hasUserSignature";
import { useAuthStore } from "@/store/auth/auth.store";
import { useProfileStore } from "@/store/profile/profile.store";
import { useUiStore } from "@/store/ui/ui-store";
import { formatCurrency, formatDate } from "@/utils/formatters";
import {
  CheckCircle2,
  FileText,
  ReceiptText,
  Send,
  Undo2,
} from "lucide-react";

type PaymentAccountReviewWorkspaceProps = {
  role: UserRole;
  roleBase: string;
  contractId: string;
  numero: number;
};

export default function PaymentAccountReviewWorkspace({
  role,
  roleBase,
  contractId,
  numero,
}: PaymentAccountReviewWorkspaceProps) {
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  useProfileQuery();
  const showToast = useUiStore((s) => s.showToast);
  const authUser = useAuthStore((s) => s.user);
  const profileUser = useProfileStore((s) => s.user);
  const signatureUser = profileUser ?? authUser;
  const hasSignature = hasUserSignature(signatureUser);

  const detailQuery = usePaymentAccountReviewDetailQuery(contractId, numero);
  const workflowMutation = usePaymentAccountWorkflowMutation(contractId, numero);

  const detail = detailQuery.data;
  const account = detail?.paymentAccount;
  const contract = detail?.contract;
  const contractor = detail?.contractor;

  const runWorkflow = async (
    action: (typeof CUENTA_COBRO_WORKFLOW_ACTION)[keyof typeof CUENTA_COBRO_WORKFLOW_ACTION],
    mensaje?: string
  ) => {
    if (!hasSignature) {
      showToast({
        message: "Debes subir tu firma en Perfil antes de continuar.",
        variant: "error",
      });
      return;
    }

    try {
      await workflowMutation.mutateAsync({ action, mensaje });
      showToast({
        message: "Cuenta actualizada correctamente",
        variant: "success",
      });
      await detailQuery.refetch();
    } catch (error) {
      showToast({
        message:
          error instanceof Error ? error.message : "No se pudo actualizar la cuenta",
        variant: "error",
      });
    }
  };

  if (detailQuery.isLoading) {
    return (
      <EmptyState
        message="Cargando revisión"
        description="Obteniendo la información de la cuenta."
        showRefreshButton={false}
        icon="refresh"
        variant="loading"
      />
    );
  }

  if (!account || !contract || !contractor) {
    return (
      <EmptyState
        message="Cuenta no disponible"
        description="No se encontró la cuenta o no tienes permiso para revisarla."
        variant="error"
        icon="alert"
        onRefresh={() => detailQuery.refetch()}
      />
    );
  }

  const canReturn = canReturnToContractor(account, role);
  const canForwardDirector =
    role === USER_ROLES.SUPERVISOR && canSupervisorForwardDirector(account);
  const canSignDirector =
    role === USER_ROLES.DIRECTOR && canDirectorSign(account);
  const canSendCad =
    role === USER_ROLES.SUPERVISOR && canSupervisorSendCad(account);
  const canJefeSend =
    role === USER_ROLES.JEFE && canJefeApproveSend(account);

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`${roleBase}/cuentas-cobro`}
          className="rounded-full bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
        >
          Volver a la bandeja
        </Link>
      </div>

      <article className="overflow-hidden rounded-4xl border border-primary/15 bg-linear-to-br from-card via-background to-primary/5 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Revisión de cuenta
              </p>
              <h3 className="mt-1 text-2xl font-black text-foreground">
                No. {account.numero}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {contractor.name} · Contrato{" "}
                {contract.actual.numeroContrato ?? contract.numeroContrato}
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {CUENTA_COBRO_STATUS_LABELS[account.estado]}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Periodo
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatDate(account.periodoInicio)} – {formatDate(account.periodoFin)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Valor
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatCurrency(account.valor)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Contratista
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {contractor.documentId}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Director
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {isDirectorSigned(account) ? "Firmada" : "Pendiente"}
            </p>
          </div>
        </div>

        {(account.devoluciones?.length ?? 0) > 0 ? (
          <div className="mt-5 rounded-2xl border border-border/70 bg-background/80 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Historial de devoluciones
            </p>
            <ul className="mt-3 space-y-3">
              {account.devoluciones?.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-border/60 bg-muted/20 p-3 text-sm"
                >
                  <p className="font-semibold text-foreground">{item.mensaje}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.deRol} · {formatDate(item.fecha)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          {!hasSignature ? (
            <Link
              href="/dashboard/perfil"
              className="rounded-full border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive"
            >
              Firma pendiente en Perfil
            </Link>
          ) : null}

          {canReturn ? (
            <ActionButton
              type="button"
              variant="outline"
              icon={Undo2}
              label="Devolver"
              onClick={() => setIsReturnModalOpen(true)}
              loading={workflowMutation.isPending}
            />
          ) : null}

          {canForwardDirector ? (
            <ActionButton
              type="button"
              variant="primary"
              icon={Send}
              label="Enviar a director"
              onClick={() =>
                void runWorkflow(CUENTA_COBRO_WORKFLOW_ACTION.FORWARD_DIRECTOR)
              }
              loading={workflowMutation.isPending}
            />
          ) : null}

          {canSignDirector ? (
            <ActionButton
              type="button"
              variant="primary"
              icon={CheckCircle2}
              label="Firmar y confirmar"
              onClick={() =>
                void runWorkflow(CUENTA_COBRO_WORKFLOW_ACTION.DIRECTOR_SIGN)
              }
              loading={workflowMutation.isPending}
            />
          ) : null}

          {canSendCad ? (
            <ActionButton
              type="button"
              variant="primary"
              icon={Send}
              label="Enviar al CAD"
              onClick={() => void runWorkflow(CUENTA_COBRO_WORKFLOW_ACTION.SEND_CAD)}
              loading={workflowMutation.isPending}
            />
          ) : null}

          {canJefeSend ? (
            <ActionButton
              type="button"
              variant="primary"
              icon={CheckCircle2}
              label="Firmar y enviar al CAD"
              onClick={() =>
                void runWorkflow(CUENTA_COBRO_WORKFLOW_ACTION.JEFE_APPROVE_SEND)
              }
              loading={workflowMutation.isPending}
            />
          ) : null}

          {role === USER_ROLES.SUPERVISOR &&
          account.estado === "PENDIENTE_ENVIO_CAD" &&
          !isDirectorSigned(account) ? (
            <span className="rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
              Falta firma del director para enviar al CAD
            </span>
          ) : null}
        </div>
      </article>

      <article className="rounded-4xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <h4 className="text-lg font-black text-foreground">Actividades</h4>
        </div>
        {detail.activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin actividades registradas.</p>
        ) : (
          <div className="grid gap-3">
            {detail.activities.map((activity) => (
              <div
                key={activity.orden}
                className="rounded-2xl border border-border/70 bg-background/70 p-4"
              >
                <p className="font-semibold text-foreground">{activity.actividad}</p>
                <p className="mt-1 text-sm text-muted-foreground">{activity.accion}</p>
                <p className="mt-2 text-xs font-semibold text-primary">
                  Ejecución: {activity.ejecucion}%
                </p>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="rounded-4xl border border-border/80 bg-card p-6 shadow-sm">
        <h4 className="text-lg font-black text-foreground">Soportes del periodo</h4>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {detail.accountDocuments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin documentos de cuenta.</p>
          ) : (
            detail.accountDocuments.map((document) => (
              <div
                key={document.id}
                className="rounded-2xl border border-border/70 bg-background/70 p-4"
              >
                <p className="text-sm font-semibold text-foreground">
                  {document.originalName ?? document.tipoDocumento}
                </p>
                <div className="mt-2">
                  <FileLink
                    url={document.filePath}
                    displayName={document.originalName ?? document.tipoDocumento}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </article>

      <PaymentAccountDevolucionModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        loading={workflowMutation.isPending}
        onConfirm={async (mensaje) => {
          await runWorkflow(CUENTA_COBRO_WORKFLOW_ACTION.RETURN, mensaje);
          setIsReturnModalOpen(false);
        }}
      />
    </section>
  );
}
