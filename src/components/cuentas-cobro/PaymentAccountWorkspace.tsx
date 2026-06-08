"use client";

import { useState } from "react";
import ActionButton from "@/components/buttons/ActionButton";
import PaymentAccountActivitiesModal from "@/components/cuentas-cobro/PaymentAccountActivitiesModal";
import FileLink from "@/components/files/FileLink";
import FileUpload from "@/components/forms/FileUpload";
import {
  useCuentaCobroActivitiesQuery,
  useCuentaCobroDocumentsQuery,
  useUploadContratoDocumentMutation,
  useUploadCuentaCobroDocumentMutation,
} from "@/hooks/api/useCuentasCobro";
import {
  canSubmitPaymentAccount,
  isPaymentAccountReadOnly,
  isPaymentAccountSubmissionWindowOpen,
} from "@/lib/cuentas-cobro/paymentAccountAccess";
import {
  getNextActionablePaymentAccount,
  getPaymentDocumentRequirements,
  isPaymentAccountActionable,
  resolvePaymentPhase,
  type PaymentDocumentRequirement,
} from "@/lib/cuentas-cobro/paymentAccountRules";
import type {
  PublicContrato,
  PublicCuentaCobro,
  PublicCuentaCobroDocumento,
} from "@/types/contratos";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { CalendarClock, ListChecks, ReceiptText } from "lucide-react";
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

function DocumentUploadRow({
  requirement,
  document,
  disabled,
  onUpload,
}: {
  requirement: PaymentDocumentRequirement;
  document?: PublicCuentaCobroDocumento;
  disabled?: boolean;
  onUpload: (
    requirement: PaymentDocumentRequirement,
    file: File
  ) => Promise<void>;
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
        ) : (
          <span className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
            Pendiente
          </span>
        )}
      </div>

      {document ? (
        <div className="mb-3 rounded-2xl bg-muted/40 p-3 text-sm">
          <FileLink
            url={document.filePath}
            displayName={document.originalName ?? requirement.label}
          />
        </div>
      ) : null}

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
    </div>
  );
}

export default function PaymentAccountWorkspace({
  contract,
  paymentAccount,
  paymentAccounts,
}: PaymentAccountWorkspaceProps) {
  const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false);
  const showToast = useUiStore((s) => s.showToast);
  const readOnly = isPaymentAccountReadOnly(paymentAccount);
  const isActionable = isPaymentAccountActionable(paymentAccount, paymentAccounts);
  const nextActionable = getNextActionablePaymentAccount(paymentAccounts);
  const canSubmit = canSubmitPaymentAccount(paymentAccount) && isActionable;
  const windowOpen = isPaymentAccountSubmissionWindowOpen(paymentAccount);
  const phase = resolvePaymentPhase(paymentAccount, paymentAccounts);
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
  const activitiesQuery = useCuentaCobroActivitiesQuery(
    contract.id,
    paymentAccount.numero
  );
  const uploadContractDocument = useUploadContratoDocumentMutation(contract.id);
  const uploadAccountDocument = useUploadCuentaCobroDocumentMutation(
    contract.id,
    paymentAccount.numero
  );

  const contractDocuments = documentsQuery.data?.contractDocuments ?? [];
  const accountDocuments = documentsQuery.data?.accountDocuments ?? [];
  const activities = activitiesQuery.data?.activities.actividades ?? [];
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

  const handleSubmitPlaceholder = () => {
    showToast({
      message:
        "El envío formal de la cuenta de cobro se habilitará en la siguiente iteración.",
      variant: "info",
    });
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
            {paymentAccount.estado} · {phase.toLowerCase()}
          </span>
        </div>

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

        {!windowOpen && !readOnly ? (
          <p className="mt-4 flex items-start gap-2 rounded-2xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Esta cuenta aún no está en ventana de envío o el periodo ya venció.
            Podrás gestionarla cuando corresponda según las fechas del contrato.
          </p>
        ) : null}
        {!isActionable && !readOnly ? (
          <p className="mt-4 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            Debes completar primero la cuenta No. {nextActionable?.numero}. Para
            mantener el orden del proceso, esta cuenta queda solo en consulta.
          </p>
        ) : null}
      </article>

      <article className="rounded-4xl border border-dashed border-primary/25 bg-linear-to-br from-background via-card to-primary/5 p-8 shadow-sm">
        <h3 className="text-xl font-black text-foreground">
          {readOnly ? "Detalle de cuenta enviada" : "Formulario de cuenta de cobro"}
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {readOnly
            ? "Esta cuenta ya fue enviada o finalizada. Aquí podrás consultar soportes y trazabilidad cuando esté disponible."
            : "Completa el formulario con soportes y validaciones. El envío formal se conectará en la siguiente iteración."}
        </p>

        {!readOnly && canSubmit ? (
          <div className="mt-6 flex justify-end">
            <ActionButton
              type="button"
              variant="primary"
              label="Enviar cuenta de cobro"
              onClick={handleSubmitPlaceholder}
            />
          </div>
        ) : null}
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
            />
          ))}
        </div>
      </article>

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
