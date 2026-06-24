"use client";

import Link from "next/link";
import { useState } from "react";
import ActionButton from "@/components/buttons/ActionButton";
import PaymentAccountActivitiesModal from "@/components/cuentas-cobro/PaymentAccountActivitiesModal";
import PaymentAccountDeclarationsModal from "@/components/cuentas-cobro/PaymentAccountDeclarationsModal";
import PaymentAccountGfrFo11Modal from "@/components/cuentas-cobro/PaymentAccountGfrFo11Modal";
import PaymentAccountReembolsablesModal from "@/components/cuentas-cobro/PaymentAccountReembolsablesModal";
import PaymentAccountSeguridadSocialModal from "@/components/cuentas-cobro/PaymentAccountSeguridadSocialModal";
import FileLink from "@/components/files/FileLink";
import FileUpload from "@/components/forms/FileUpload";
import {
  useCuentaCobroActivitiesQuery,
  useCuentaCobroDeclarationsQuery,
  useCuentaCobroDocumentsQuery,
  useCuentaCobroGfrFo11Query,
  useCuentaCobroReembolsablesQuery,
  usePaymentAccountWorkflowMutation,
  useSaveCuentaCobroDeclarationsMutation,
  useSaveCuentaCobroGfrFo11Mutation,
  useSaveCuentaCobroReembolsablesMutation,
  useUploadContratoDocumentMutation,
  useUploadCuentaCobroDocumentMutation,
} from "@/hooks/api/useCuentasCobro";
import {
  CUENTA_COBRO_STATUS_LABELS,
  CUENTA_COBRO_WORKFLOW_ACTION,
  isDirectorSigned,
} from "@/constants/cuentaCobroWorkflow";
import { useProfileQuery } from "@/hooks/api/useProfile";
import {
  canSubmitPaymentAccount,
  isPaymentAccountReadOnly,
  isPaymentAccountSubmissionWindowOpen,
} from "@/lib/cuentas-cobro/paymentAccountAccess";
import { isDevPaymentAccountWindowSkipped } from "@/lib/cuentas-cobro/devPaymentAccountWindow";
import {
  validatePaymentAccountReadiness,
  type PaymentAccountReadinessIssue,
} from "@/lib/cuentas-cobro/paymentAccountReadiness";
import {
  getNextActionablePaymentAccount,
  getPaymentDocumentRequirements,
  includesGfrFo11,
  isPaymentAccountActionable,
  resolvePaymentPhase,
  type PaymentDocumentRequirement,
} from "@/lib/cuentas-cobro/paymentAccountRules";
import {
  formatDeclarationsSummary,
  paymentAccountStoreKey,
} from "@/lib/cuentas-cobro/paymentAccountDeclarations";
import { formatGfrFo11Summary } from "@/lib/cuentas-cobro/gfrFo11Responses";
import {
  contractRequiresReembolsables,
  formatReembolsablesContractSummary,
  formatReembolsablesSummary,
  isReembolsablesComplete,
} from "@/lib/cuentas-cobro/paymentAccountReembolsables";
import {
  formatSeguridadSocialPlantillaSummary,
  SEGURIDAD_SOCIAL_TIPO,
} from "@/lib/cuentas-cobro/seguridadSocialPlantilla";
import { hasContractorSignature } from "@/lib/profile/hasContractorSignature";
import { useAuthStore } from "@/store/auth/auth.store";
import { useCuentasCobroStore } from "@/store/cuentas-cobro/cuentas-cobro.store";
import { useProfileStore } from "@/store/profile/profile.store";
import type {
  PublicContrato,
  PublicCuentaCobro,
  PublicCuentaCobroDocumento,
  SeguridadSocialPlantillaMetadata,
} from "@/types/contratos";
import { formatCurrency, formatDate } from "@/utils/formatters";
import type { ElementType } from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Eye,
  ListChecks,
  Lock,
  PenLine,
  ReceiptText,
  Send,
  Wallet,
} from "lucide-react";
import { useUiStore } from "@/store/ui/ui-store";

type PaymentAccountWorkspaceProps = {
  contract: PublicContrato;
  paymentAccount: PublicCuentaCobro;
  paymentAccounts: PublicCuentaCobro[];
};

function findDocument(
  documents: PublicCuentaCobroDocumento[],
  tipoDocumento: string
) {
  return documents.find((document) => document.tipoDocumento === tipoDocumento);
}

function readinessIssueLabel(issue: PaymentAccountReadinessIssue) {
  switch (issue) {
    case "MISSING_ACTIVITIES":
      return "Sin actividades";
    case "MISSING_SEGURIDAD_SOCIAL":
      return "Sin soporte SS";
    case "MISSING_PLANTILLA":
      return "Sin plantilla";
    case "MISSING_DECLARATIONS":
      return "Sin juramento";
    case "MISSING_GFR_FO_11":
      return "Sin GFR-FO-11";
    case "MISSING_CONTRACT_DOCUMENT":
      return "Faltan docs. contrato";
    default:
      return "Requisitos pendientes";
  }
}

type WorkflowChipTone = "neutral" | "primary" | "destructive" | "success";

function WorkflowChip({
  icon: Icon,
  label,
  tone = "neutral",
  href,
  title,
}: {
  icon: ElementType<{ className?: string }>;
  label: string;
  tone?: WorkflowChipTone;
  href?: string;
  title?: string;
}) {
  const toneClasses: Record<WorkflowChipTone, string> = {
    neutral: "border-border/70 bg-muted/40 text-muted-foreground",
    primary: "border-primary/25 bg-primary/10 text-primary",
    destructive: "border-destructive/25 bg-destructive/10 text-destructive",
    success: "border-primary/25 bg-primary/10 text-primary",
  };

  const className = `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${toneClasses[tone]} ${href ? "hover:border-primary/40 hover:bg-primary/15" : ""}`;

  const content = (
    <span className={className} title={title}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {label}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
}

function DocumentUploadRow({
  requirement,
  document,
  disabled,
  onUpload,
  onOpenPlantillaModal,
  onOpenDeclarationsModal,
  declarationsSummary,
}: {
  requirement: PaymentDocumentRequirement;
  document?: PublicCuentaCobroDocumento;
  disabled?: boolean;
  onUpload: (
    requirement: PaymentDocumentRequirement,
    file: File
  ) => Promise<void>;
  onOpenPlantillaModal?: (requirement: PaymentDocumentRequirement) => void;
  onOpenDeclarationsModal?: () => void;
  declarationsSummary?: string | null;
}) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h4 className="font-bold text-foreground">
            {requirement.label}
            {requirement.required ? (
              <span className="ml-1 text-destructive">*</span>
            ) : null}
          </h4>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {requirement.helperText}
          </p>
        </div>
        {document ? (
          <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            Cargado
          </span>
        ) : requirement.required ? (
          <span className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
            Pendiente
          </span>
        ) : (
          <span className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
            Opcional
          </span>
        )}
      </div>

      {document ? (
        <div className="mb-3 space-y-2 rounded-2xl bg-muted/40 p-3 text-sm">
          <FileLink
            url={document.filePath}
            displayName={document.originalName ?? requirement.label}
          />
          {document.metadata ? (
            <p className="text-xs font-semibold text-muted-foreground">
              {formatSeguridadSocialPlantillaSummary(document.metadata)}
            </p>
          ) : null}
        </div>
      ) : null}

      {declarationsSummary ? (
        <p className="mb-3 text-xs font-semibold text-muted-foreground">
          {declarationsSummary}
        </p>
      ) : null}

      {requirement.requiresPlantilla && onOpenPlantillaModal ? (
        <div className="flex flex-wrap gap-3">
          <ActionButton
            type="button"
            variant={document ? "outline" : "primary"}
            label={document ? "Editar soporte" : "Subir soporte"}
            disabled={disabled}
            onClick={() => onOpenPlantillaModal(requirement)}
            className="w-full sm:w-auto"
          />
          {onOpenDeclarationsModal ? (
            <ActionButton
              type="button"
              variant={declarationsSummary ? "outline" : "primary"}
              label={
                declarationsSummary
                  ? "Editar declaraciones"
                  : "Declaraciones juradas"
              }
              disabled={disabled}
              onClick={onOpenDeclarationsModal}
              className="w-full sm:w-auto"
            />
          ) : null}
        </div>
      ) : (
        <FileUpload
          id={`${requirement.scope}-${requirement.tipoDocumento}`}
          name={requirement.tipoDocumento}
          label={document ? "Reemplazar PDF" : "Subir PDF"}
          disabled={disabled}
          currentFileName={document?.originalName ?? undefined}
          onChange={(file) => {
            if (file) void onUpload(requirement, file);
          }}
        />
      )}
    </div>
  );
}

export default function PaymentAccountWorkspace({
  contract,
  paymentAccount,
  paymentAccounts,
}: PaymentAccountWorkspaceProps) {
  const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false);
  const [seguridadSocialRequirement, setSeguridadSocialRequirement] =
    useState<PaymentDocumentRequirement | null>(null);
  const [isDeclarationsModalOpen, setIsDeclarationsModalOpen] = useState(false);
  const [isGfrFo11ModalOpen, setIsGfrFo11ModalOpen] = useState(false);
  const [isReembolsablesModalOpen, setIsReembolsablesModalOpen] = useState(false);
  useProfileQuery();
  const showToast = useUiStore((s) => s.showToast);
  const authUser = useAuthStore((s) => s.user);
  const profileUser = useProfileStore((s) => s.user);
  const signatureUser = profileUser ?? authUser;
  const hasSignature = hasContractorSignature(signatureUser);
  const declarationsByAccount = useCuentasCobroStore((s) => s.declarationsByAccount);
  const accountStoreKey = paymentAccountStoreKey(contract.id, paymentAccount.numero);
  const savedDeclarations = declarationsByAccount[accountStoreKey] ?? null;
  const readOnly = isPaymentAccountReadOnly(paymentAccount);
  const isActionable = isPaymentAccountActionable(paymentAccount, paymentAccounts);
  const nextActionable = getNextActionablePaymentAccount(paymentAccounts);
  const canSubmitBase =
    canSubmitPaymentAccount(paymentAccount) && isActionable && !readOnly;
  const windowOpen = isPaymentAccountSubmissionWindowOpen(paymentAccount);
  const devWindowSkipped = isDevPaymentAccountWindowSkipped();
  const phase = resolvePaymentPhase(paymentAccount, paymentAccounts);
  const requiresGfrFo11 = includesGfrFo11(phase);
  const requiresReembolsables = contractRequiresReembolsables(contract);
  const requirements = getPaymentDocumentRequirements(phase);
  const contractRequirements = requirements.filter(
    (requirement) => requirement.scope === "contract"
  );
  const accountRequirements = requirements.filter(
    (requirement) => requirement.scope === "account"
  );
  const documentsQuery = useCuentaCobroDocumentsQuery(
    contract.id,
    paymentAccount.numero
  );
  const declarationsQuery = useCuentaCobroDeclarationsQuery(
    contract.id,
    paymentAccount.numero
  );
  const saveDeclarationsMutation = useSaveCuentaCobroDeclarationsMutation(
    contract.id,
    paymentAccount.numero
  );
  const gfrFo11Query = useCuentaCobroGfrFo11Query(
    contract.id,
    paymentAccount.numero,
    requiresGfrFo11
  );
  const saveGfrFo11Mutation = useSaveCuentaCobroGfrFo11Mutation(
    contract.id,
    paymentAccount.numero
  );
  const reembolsablesQuery = useCuentaCobroReembolsablesQuery(
    contract.id,
    paymentAccount.numero,
    requiresReembolsables || isReembolsablesModalOpen
  );
  const saveReembolsablesMutation = useSaveCuentaCobroReembolsablesMutation(
    contract.id,
    paymentAccount.numero
  );
  const activitiesQuery = useCuentaCobroActivitiesQuery(
    contract.id,
    paymentAccount.numero
  );
  const uploadContractDocument = useUploadContratoDocumentMutation(contract.id);
  const uploadAccountDocument = useUploadCuentaCobroDocumentMutation(
    contract.id,
    paymentAccount.numero
  );
  const submitWorkflow = usePaymentAccountWorkflowMutation(
    contract.id,
    paymentAccount.numero
  );

  const contractDocuments = documentsQuery.data?.contractDocuments ?? [];
  const accountDocuments = documentsQuery.data?.accountDocuments ?? [];
  const activities = activitiesQuery.data?.activities.actividades ?? [];
  const declarations =
    declarationsQuery.data?.declarations ?? savedDeclarations ?? null;
  const gfrFo11 =
    gfrFo11Query.data?.responses ?? paymentAccount.gfrFo11 ?? null;
  const gfrFo11Config = gfrFo11Query.data?.config ?? null;
  const reembolsables =
    reembolsablesQuery.data?.responses ?? paymentAccount.reembolsables ?? null;
  const reembolsablesPrefills = reembolsablesQuery.data?.prefills ?? null;
  const reembolsablesCompleted = isReembolsablesComplete(reembolsables);
  const readiness = validatePaymentAccountReadiness({
    paymentAccount,
    paymentAccounts,
    activitiesCount: activities.length,
    accountDocuments,
    contractDocuments,
    declarations,
    gfrFo11,
  });
  const canSubmit = canSubmitBase && readiness.ready;
  const averageExecution =
    activities.length > 0
      ? Math.round(
          activities.reduce((sum, activity) => sum + activity.ejecucion, 0) /
            activities.length
        )
      : null;
  const isUploading =
    uploadContractDocument.isPending || uploadAccountDocument.isPending;

  const handleDocumentUpload = async (
    requirement: PaymentDocumentRequirement,
    file: File
  ) => {
    try {
      if (requirement.scope === "contract") {
        await uploadContractDocument.mutateAsync({
          file,
          tipoDocumento: requirement.tipoDocumento,
          required: requirement.required,
        });
      } else {
        await uploadAccountDocument.mutateAsync({
          file,
          tipoDocumento: requirement.tipoDocumento,
          required: requirement.required,
        });
      }
      showToast({
        message: "Documento guardado correctamente",
        variant: "success",
      });
      await documentsQuery.refetch();
    } catch (error) {
      showToast({
        message:
          error instanceof Error ? error.message : "No se pudo guardar el PDF",
        variant: "error",
      });
    }
  };

  const seguridadSocialDocument = seguridadSocialRequirement
    ? findDocument(accountDocuments, seguridadSocialRequirement.tipoDocumento)
    : null;

  const handleSeguridadSocialSave = async ({
    file,
    plantillaMetadata,
  }: {
    file: File | null;
    plantillaMetadata: SeguridadSocialPlantillaMetadata;
  }) => {
    if (!seguridadSocialRequirement) return;

    try {
      await uploadAccountDocument.mutateAsync({
        file,
        tipoDocumento: seguridadSocialRequirement.tipoDocumento,
        required: seguridadSocialRequirement.required,
        plantillaMetadata,
      });
      showToast({
        message: "Soporte de seguridad social guardado correctamente",
        variant: "success",
      });
      await documentsQuery.refetch();
      setSeguridadSocialRequirement(null);
    } catch (error) {
      showToast({
        message:
          error instanceof Error ? error.message : "No se pudo guardar el soporte",
        variant: "error",
      });
    }
  };

  const handleSubmit = async () => {
    if (!hasSignature) {
      showToast({
        message:
          "Debes subir tu firma en Perfil antes de enviar la cuenta de cobro.",
        variant: "error",
      });
      return;
    }

    if (!readiness.ready) {
      showToast({
        message:
          readiness.messages[0] ??
          "Completa los requisitos antes de enviar la cuenta de cobro.",
        variant: "error",
      });
      return;
    }

    try {
      await submitWorkflow.mutateAsync({
        action: CUENTA_COBRO_WORKFLOW_ACTION.SUBMIT,
      });
      showToast({
        message: "Cuenta enviada correctamente",
        variant: "success",
      });
    } catch (error) {
      showToast({
        message:
          error instanceof Error ? error.message : "No se pudo enviar la cuenta",
        variant: "error",
      });
    }
  };

  return (
    <section className="grid gap-6">
      <article className="overflow-hidden rounded-4xl border border-primary/15 bg-linear-to-br from-card via-background to-primary/5 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Cuenta de cobro
              </p>
              <h3 className="mt-1 text-2xl font-black text-foreground">
                No. {paymentAccount.numero}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Contrato {contract.actual.numeroContrato ?? contract.numeroContrato}
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {CUENTA_COBRO_STATUS_LABELS[paymentAccount.estado]} · {phase.toLowerCase()}
          </span>
        </div>

        {paymentAccount.estado === "PENDIENTE_CONTRATISTA" &&
        paymentAccount.observaciones ? (
          <div className="mt-4 rounded-2xl border border-destructive/25 bg-destructive/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-destructive">
              Devuelta para corrección
            </p>
            <p className="mt-2 text-sm leading-6 text-foreground">
              {paymentAccount.observaciones}
            </p>
          </div>
        ) : null}

        {paymentAccount.estado === "PENDIENTE_CONTRATISTA" &&
        isDirectorSigned(paymentAccount) ? (
          <p className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary">
            El director ya firmó esta cuenta. Al reenviarla irá directo al
            supervisor para envío al CAD.
          </p>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Periodo
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatDate(paymentAccount.periodoInicio)} –{" "}
              {formatDate(paymentAccount.periodoFin)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Valor
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatCurrency(paymentAccount.valor)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Disponible desde
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatDate(paymentAccount.fechaHabilitadaEnvio)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Límite de envío
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatDate(paymentAccount.fechaLimiteEnvio)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/70 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {readOnly ? (
              <WorkflowChip
                icon={Eye}
                label="Solo consulta"
                tone="neutral"
                title="Cuenta enviada o finalizada"
              />
            ) : (
              <WorkflowChip
                icon={PenLine}
                label="En preparación"
                tone="primary"
                title="Completa soportes y actividades"
              />
            )}

            {!readOnly && !windowOpen ? (
              <WorkflowChip
                icon={CalendarClock}
                label="Fuera de ventana"
                tone="neutral"
                title="Aún no está en periodo de envío o ya venció"
              />
            ) : null}

            {devWindowSkipped ? (
              <WorkflowChip
                icon={CalendarClock}
                label="Ventana omitida (dev)"
                tone="neutral"
                title="DEV_SKIP_PAYMENT_ACCOUNT_WINDOW está activo"
              />
            ) : null}

            {!readOnly && !isActionable ? (
              <WorkflowChip
                icon={Lock}
                label={`Completa cuenta No. ${nextActionable?.numero ?? "—"}`}
                tone="destructive"
                title="Debes terminar la cuenta anterior primero"
              />
            ) : null}

            {!readOnly && hasSignature ? (
              <WorkflowChip
                icon={CheckCircle2}
                label="Firma lista"
                tone="success"
              />
            ) : null}

            {!readOnly && !hasSignature ? (
              <WorkflowChip
                icon={AlertCircle}
                label="Firma pendiente"
                tone="destructive"
                href="/dashboard/perfil"
                title="Sube tu firma en Perfil para enviar"
              />
            ) : null}

            {!readOnly && canSubmitBase && !readiness.ready
              ? readiness.issues.map((issue) => (
                  <WorkflowChip
                    key={issue}
                    icon={AlertCircle}
                    label={readinessIssueLabel(issue)}
                    tone="destructive"
                    title={readiness.messages.join(" ")}
                  />
                ))
              : null}
          </div>

          {!readOnly && canSubmitBase ? (
            <ActionButton
              type="button"
              variant="primary"
              icon={Send}
              label="Enviar cuenta"
              onClick={() => void handleSubmit()}
              loading={submitWorkflow.isPending}
              disabled={!canSubmit}
              className="w-full shrink-0 sm:w-auto"
            />
          ) : null}
        </div>
      </article>

      <article className="rounded-4xl border border-border/80 bg-linear-to-br from-card via-background to-ring/5 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Actividades ejecutadas
            </p>
            <h3 className="mt-2 text-xl font-black text-foreground">
              Acciones, soportes y ejecución
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Registra las actividades del periodo con acciones realizadas,
              soporte textual o archivo y porcentaje de ejecución.
            </p>
          </div>
          <ActionButton
            type="button"
            variant="primary"
            icon={ListChecks}
            label={activities.length > 0 ? "Editar actividades" : "Agregar actividades"}
            onClick={() => setIsActivitiesModalOpen(true)}
          />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Actividades
            </p>
            <p className="mt-1 text-2xl font-black text-foreground">
              {activities.length}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Ejecución promedio
            </p>
            <p className="mt-1 text-2xl font-black text-foreground">
              {averageExecution == null ? "Sin datos" : `${averageExecution}%`}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Soportes por archivo
            </p>
            <p className="mt-1 text-2xl font-black text-foreground">
              {
                activities.filter(
                  (activity) => activity.soporteTipo === "ARCHIVO"
                ).length
              }
            </p>
          </div>
        </div>
      </article>

      {requiresReembolsables ? (
        <article className="rounded-4xl border border-border/80 bg-linear-to-br from-card via-background to-ring/5 p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Gastos reembolsables
              </p>
              <h3 className="mt-2 text-xl font-black text-foreground">
                Reembolsables
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Este contrato incluye rubro y concepto reembolsables. Debes
                completar el formulario en cada cuenta de cobro.
              </p>
              <p className="mt-3 rounded-2xl border border-border/70 bg-background/70 p-3 text-sm font-semibold text-foreground">
                {formatReembolsablesContractSummary(contract)}
              </p>
              {reembolsablesCompleted ? (
                <p className="mt-3 rounded-2xl border border-border/70 bg-background/70 p-3 text-sm font-semibold text-foreground">
                  {formatReembolsablesSummary(reembolsables)}
                </p>
              ) : (
                <p className="mt-3 text-sm font-semibold text-destructive">
                  Pendiente de completar.
                </p>
              )}
            </div>
            <ActionButton
              type="button"
              variant="primary"
              icon={Wallet}
              label={
                reembolsablesCompleted
                  ? "Editar reembolsables"
                  : "Completar reembolsables"
              }
              onClick={() => {
                setIsReembolsablesModalOpen(true);
                void reembolsablesQuery.refetch();
              }}
              disabled={readOnly || !isActionable}
            />
          </div>
        </article>
      ) : null}

      {requiresGfrFo11 ? (
        <article className="rounded-4xl border border-border/80 bg-linear-to-br from-card via-background to-ring/5 p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Certificado responsable de IVA
              </p>
              <h3 className="mt-2 text-xl font-black text-foreground">
                GFR-FO-11
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Requerido solo en la primera cuenta de cobro. Debes completarlo
                antes de enviar la cuenta al flujo de revisión.
              </p>
              {gfrFo11 ? (
                <p className="mt-3 rounded-2xl border border-border/70 bg-background/70 p-3 text-sm font-semibold text-foreground">
                  {formatGfrFo11Summary(gfrFo11)}
                </p>
              ) : (
                <p className="mt-3 text-sm font-semibold text-destructive">
                  Pendiente de completar.
                </p>
              )}
            </div>
            <ActionButton
              type="button"
              variant="primary"
              icon={ReceiptText}
              label={gfrFo11 ? "Editar GFR-FO-11" : "Completar GFR-FO-11"}
              onClick={() => setIsGfrFo11ModalOpen(true)}
              disabled={readOnly || !isActionable}
            />
          </div>
        </article>
      ) : null}

      {contractRequirements.length > 0 ? (
        <article className="rounded-4xl border border-border/80 bg-linear-to-br from-card via-background to-muted/20 p-6 shadow-sm md:p-8">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Documentos reutilizables
            </p>
            <h3 className="mt-2 text-xl font-black text-foreground">
              Archivos del contrato
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Estos documentos se guardan directamente en la carpeta del contrato.
              Solo se solicitan en la primera, última o única cuenta de cobro.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {contractRequirements.map((requirement) => (
              <DocumentUploadRow
                key={requirement.tipoDocumento}
                requirement={requirement}
                document={findDocument(
                  contractDocuments,
                  requirement.tipoDocumento
                )}
                disabled={readOnly || isUploading || !isActionable}
                onUpload={handleDocumentUpload}
              />
            ))}
          </div>
        </article>
      ) : null}

      <article className="rounded-4xl border border-border/80 bg-linear-to-br from-card via-background to-primary/5 p-6 shadow-sm md:p-8">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Documentos de la cuenta
          </p>
          <h3 className="mt-2 text-xl font-black text-foreground">
            Soportes del periodo
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Estos archivos quedan dentro de la carpeta de la cuenta de cobro No.{" "}
            {paymentAccount.numero}.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {accountRequirements.map((requirement) => (
            <DocumentUploadRow
              key={requirement.tipoDocumento}
              requirement={requirement}
              document={findDocument(
                accountDocuments,
                requirement.tipoDocumento
              )}
              disabled={readOnly || isUploading || !isActionable}
              onUpload={handleDocumentUpload}
              onOpenPlantillaModal={
                requirement.requiresPlantilla
                  ? setSeguridadSocialRequirement
                  : undefined
              }
              onOpenDeclarationsModal={
                requirement.tipoDocumento === SEGURIDAD_SOCIAL_TIPO
                  ? () => setIsDeclarationsModalOpen(true)
                  : undefined
              }
              declarationsSummary={
                requirement.tipoDocumento === SEGURIDAD_SOCIAL_TIPO &&
                declarations
                  ? formatDeclarationsSummary(declarations)
                  : null
              }
            />
          ))}
        </div>
      </article>

      {isGfrFo11ModalOpen && gfrFo11Config ? (
        <PaymentAccountGfrFo11Modal
          isOpen={isGfrFo11ModalOpen}
          onClose={() => setIsGfrFo11ModalOpen(false)}
          initialResponses={gfrFo11}
          config={gfrFo11Config}
          disabled={readOnly || !isActionable}
          loading={saveGfrFo11Mutation.isPending || gfrFo11Query.isLoading}
          onSave={async (responses) => {
            try {
              await saveGfrFo11Mutation.mutateAsync(responses);
              showToast({
                message: "Certificado GFR-FO-11 guardado",
                variant: "success",
              });
              setIsGfrFo11ModalOpen(false);
            } catch (error) {
              showToast({
                message:
                  error instanceof Error
                    ? error.message
                    : "No se pudo guardar el certificado GFR-FO-11",
                variant: "error",
              });
            }
          }}
        />
      ) : null}

      {isReembolsablesModalOpen ? (
        <PaymentAccountReembolsablesModal
          isOpen={isReembolsablesModalOpen}
          onClose={() => setIsReembolsablesModalOpen(false)}
          prefills={reembolsablesPrefills}
          prefillsLoading={reembolsablesQuery.isLoading}
          prefillsError={
            reembolsablesQuery.error instanceof Error
              ? reembolsablesQuery.error.message
              : null
          }
          initialResponses={reembolsables}
          disabled={readOnly || !isActionable}
          loading={saveReembolsablesMutation.isPending}
          onSave={async (responses) => {
            try {
              await saveReembolsablesMutation.mutateAsync(responses);
              showToast({
                message: "Reembolsables guardados",
                variant: "success",
              });
              setIsReembolsablesModalOpen(false);
            } catch (error) {
              showToast({
                message:
                  error instanceof Error
                    ? error.message
                    : "No se pudieron guardar los reembolsables",
                variant: "error",
              });
            }
          }}
        />
      ) : null}

      {isDeclarationsModalOpen ? (
        <PaymentAccountDeclarationsModal
          isOpen={isDeclarationsModalOpen}
          onClose={() => setIsDeclarationsModalOpen(false)}
          initialDeclarations={declarations}
          disabled={readOnly || !isActionable}
          loading={saveDeclarationsMutation.isPending || declarationsQuery.isLoading}
          onSave={async (declarations) => {
            try {
              await saveDeclarationsMutation.mutateAsync(declarations);
              showToast({
                message: "Declaraciones juradas guardadas",
                variant: "success",
              });
              setIsDeclarationsModalOpen(false);
            } catch (error) {
              showToast({
                message:
                  error instanceof Error
                    ? error.message
                    : "No se pudieron guardar las declaraciones",
                variant: "error",
              });
            }
          }}
        />
      ) : null}

      {seguridadSocialRequirement ? (
        <PaymentAccountSeguridadSocialModal
          isOpen={Boolean(seguridadSocialRequirement)}
          onClose={() => setSeguridadSocialRequirement(null)}
          existingDocument={seguridadSocialDocument}
          disabled={readOnly || !isActionable}
          loading={uploadAccountDocument.isPending}
          onSave={handleSeguridadSocialSave}
        />
      ) : null}

      {isActivitiesModalOpen ? (
        <PaymentAccountActivitiesModal
          isOpen={isActivitiesModalOpen}
          onClose={() => setIsActivitiesModalOpen(false)}
          contractId={contract.id}
          numeroCuenta={paymentAccount.numero}
          initialActivities={activities}
          onSaved={() => {
            showToast({
              message: "Actividades guardadas correctamente",
              variant: "success",
            });
            void activitiesQuery.refetch();
          }}
        />
      ) : null}
    </section>
  );
}
