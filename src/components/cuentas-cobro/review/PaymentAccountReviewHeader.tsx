import Link from "next/link";
import ActionButton from "@/components/buttons/ActionButton";
import {
  CUENTA_COBRO_STATUS_LABELS,
  CUENTA_COBRO_WORKFLOW_ACTION,
  isDirectorSigned,
} from "@/constants/cuentaCobroWorkflow";
import { USER_ROLES, type UserRole } from "@/constants/userRoles";
import type {
  PaymentAccountReviewContractor,
  PublicContrato,
  PublicCuentaCobro,
} from "@/types/contratos";
import { formatCurrency, formatDate } from "@/utils/formatters";
import {
  CheckCircle2,
  ReceiptText,
  Send,
  Undo2,
} from "lucide-react";

type PaymentAccountReviewHeaderProps = {
  role: UserRole;
  roleBase: string;
  account: PublicCuentaCobro;
  contract: PublicContrato;
  contractor: PaymentAccountReviewContractor;
  phaseLabel: string;
  hasSignature: boolean;
  workflowPending: boolean;
  devSendCadStateSkipped: boolean;
  canReturn: boolean;
  canForwardDirector: boolean;
  canSignDirector: boolean;
  canSendCad: boolean;
  canJefeSend: boolean;
  onReturnClick: () => void;
  onWorkflowAction: (
    action: (typeof CUENTA_COBRO_WORKFLOW_ACTION)[keyof typeof CUENTA_COBRO_WORKFLOW_ACTION]
  ) => void;
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-foreground">{value}</p>
    </div>
  );
}

export default function PaymentAccountReviewHeader({
  role,
  roleBase,
  account,
  contract,
  contractor,
  phaseLabel,
  hasSignature,
  workflowPending,
  devSendCadStateSkipped,
  canReturn,
  canForwardDirector,
  canSignDirector,
  canSendCad,
  canJefeSend,
  onReturnClick,
  onWorkflowAction,
}: PaymentAccountReviewHeaderProps) {
  const contractNumber =
    contract.actual.numeroContrato ?? contract.numeroContrato;
  const latestDevolucion = account.devoluciones?.at(-1);

  return (
    <article className="overflow-hidden rounded-4xl border border-primary/15 bg-linear-to-br from-card via-background to-primary/5 shadow-sm">
      <div className="p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Link
              href={`${roleBase}/cuentas-cobro`}
              className="hidden shrink-0 rounded-full bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-primary/10 hover:text-primary sm:inline-flex"
            >
              Bandeja
            </Link>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-foreground md:text-3xl">
                  Cuenta No. {account.numero}
                </h1>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase text-primary">
                  {CUENTA_COBRO_STATUS_LABELS[account.estado]}
                </span>
                <span className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-bold uppercase text-muted-foreground">
                  {phaseLabel}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {contractor.name} · Contrato {contractNumber}
              </p>
            </div>
          </div>

          <Link
            href={`${roleBase}/cuentas-cobro`}
            className="inline-flex w-fit rounded-full bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-primary/10 hover:text-primary sm:hidden"
          >
            Volver a la bandeja
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Periodo"
            value={`${formatDate(account.periodoInicio)} – ${formatDate(account.periodoFin)}`}
          />
          <StatCard label="Valor" value={formatCurrency(account.valor)} />
          <StatCard
            label="Director"
            value={isDirectorSigned(account) ? "Firmada" : "Pendiente"}
          />
          <StatCard label="Tipo de cuenta" value={phaseLabel} />
        </div>

        {latestDevolucion ? (
          <div className="mt-6 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 md:p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
              Última devolución
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-foreground">
              {latestDevolucion.mensaje}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {latestDevolucion.deRol} · {formatDate(latestDevolucion.fecha)}
            </p>
          </div>
        ) : null}
      </div>

      <div className="sticky bottom-0 z-10 mt-2 flex flex-wrap gap-3 border-t border-border/50 bg-card/95 p-6 backdrop-blur-sm md:static md:bg-transparent">
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
            onClick={onReturnClick}
            loading={workflowPending}
          />
        ) : null}

        {canForwardDirector ? (
          <ActionButton
            type="button"
            variant="primary"
            icon={Send}
            label="Enviar a director"
            onClick={() =>
              onWorkflowAction(CUENTA_COBRO_WORKFLOW_ACTION.FORWARD_DIRECTOR)
            }
            loading={workflowPending}
          />
        ) : null}

        {canSignDirector ? (
          <ActionButton
            type="button"
            variant="primary"
            icon={CheckCircle2}
            label="Firmar y confirmar"
            onClick={() =>
              onWorkflowAction(CUENTA_COBRO_WORKFLOW_ACTION.DIRECTOR_SIGN)
            }
            loading={workflowPending}
          />
        ) : null}

        {canSendCad ? (
          <ActionButton
            type="button"
            variant="primary"
            icon={Send}
            label="Enviar al CAD"
            onClick={() =>
              onWorkflowAction(CUENTA_COBRO_WORKFLOW_ACTION.SEND_CAD)
            }
            loading={workflowPending}
          />
        ) : null}

        {canJefeSend ? (
          <ActionButton
            type="button"
            variant="primary"
            icon={CheckCircle2}
            label="Firmar y enviar al CAD"
            onClick={() =>
              onWorkflowAction(CUENTA_COBRO_WORKFLOW_ACTION.JEFE_APPROVE_SEND)
            }
            loading={workflowPending}
          />
        ) : null}

        {role === USER_ROLES.SUPERVISOR &&
        account.estado === "PENDIENTE_ENVIO_CAD" &&
        !isDirectorSigned(account) ? (
          <span className="rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive">
            Falta firma del director para enviar al CAD
          </span>
        ) : null}

        {devSendCadStateSkipped ? (
          <span
            className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700"
            title="DEV_SKIP_SEND_CAD_STATE está activo"
          >
            Envío CAD sin cambio de estado (dev)
          </span>
        ) : null}
      </div>
    </article>
  );
}
