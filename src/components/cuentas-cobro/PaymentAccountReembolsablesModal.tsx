"use client";

import { useEffect, useMemo, useState } from "react";
import ActionButton from "@/components/buttons/ActionButton";
import EncargosComisionTable from "@/components/cuentas-cobro/EncargosComisionTable";
import FormField from "@/components/forms/FormField";
import Modal from "@/components/modals/Modal";
import { useMunicipiosQuery, useSubregionesQuery } from "@/hooks/api/useCatalogos";
import {
  createEmptyEncargoComision,
  defaultPaymentAccountReembolsables,
  type PaymentAccountReembolsables,
  type ReembolsablesPrefills,
} from "@/lib/cuentas-cobro/paymentAccountReembolsables";
import { formatDate } from "@/utils/formatters";

type PaymentAccountReembolsablesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  prefills?: ReembolsablesPrefills | null;
  prefillsLoading?: boolean;
  prefillsError?: string | null;
  initialResponses?: PaymentAccountReembolsables | null;
  disabled?: boolean;
  loading?: boolean;
  onSave: (responses: PaymentAccountReembolsables) => void | Promise<void>;
};

function ReadonlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export default function PaymentAccountReembolsablesModal({
  isOpen,
  onClose,
  prefills,
  prefillsLoading = false,
  prefillsError = null,
  initialResponses,
  disabled = false,
  loading = false,
  onSave,
}: PaymentAccountReembolsablesModalProps) {
  const subregionesQuery = useSubregionesQuery(isOpen);
  const municipiosQuery = useMunicipiosQuery(null, isOpen);

  const initialForm = useMemo<PaymentAccountReembolsables>(() => {
    if (initialResponses?.encargos?.length) {
      return {
        encargos: initialResponses.encargos,
        cumplimientoObjetivos: initialResponses.cumplimientoObjetivos ?? "",
        observaciones: initialResponses.observaciones ?? "",
      };
    }

    return {
      ...defaultPaymentAccountReembolsables,
      encargos: [createEmptyEncargoComision(0)],
    };
  }, [initialResponses]);

  const [form, setForm] = useState<PaymentAccountReembolsables>(initialForm);

  useEffect(() => {
    if (isOpen) {
      setForm(initialForm);
    }
  }, [isOpen, initialForm]);

  const periodoLabel =
    prefills?.periodoInicio && prefills?.periodoFin
      ? `${formatDate(prefills.periodoInicio)} – ${formatDate(prefills.periodoFin)}`
      : "Sin período";

  const isFormDisabled = disabled || loading || prefillsLoading;

  const handleSave = async () => {
    await onSave({
      encargos: form.encargos.map((encargo, index) => ({
        ...encargo,
        id: encargo.id || String(index + 1).padStart(5, "0"),
      })),
      cumplimientoObjetivos: form.cumplimientoObjetivos?.trim() || undefined,
      observaciones: form.observaciones?.trim() || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reembolsables — GTH-FO-52"
      tamaño="xl"
    >
      <div className="grid gap-6">
        {prefillsLoading ? (
          <p className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
            Cargando datos del formulario…
          </p>
        ) : prefillsError ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {prefillsError}
          </p>
        ) : prefills ? (
          <div className="grid gap-3 rounded-2xl border border-border/70 bg-muted/30 p-4 md:grid-cols-2">
            <ReadonlyField label="Documento" value={prefills.documentId} />
            <ReadonlyField label="Nombres y apellidos" value={prefills.name} />
            <ReadonlyField label="Área" value={prefills.organizationalUnitName} />
            <ReadonlyField label="Contrato" value={prefills.numeroContrato} />
            <ReadonlyField label="Período cuenta" value={periodoLabel} />
            <ReadonlyField label="Corte" value={prefills.periodoCorte} />
            <ReadonlyField
              label="Rubro reembolsable"
              value={prefills.rubroRembolsable ?? "Sin registrar"}
            />
            <ReadonlyField
              label="Concepto reembolsable"
              value={prefills.conceptoRembolsable ?? "Sin registrar"}
            />
            <ReadonlyField
              label="Coordinador"
              value={prefills.coordinadorNombre}
            />
            <ReadonlyField label="Modalidad" value={prefills.modalidad} />
          </div>
        ) : null}

        <div>
          <h3 className="text-base font-black text-foreground">
            Encargos de comisión
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Registra hasta 8 encargos de comisión para esta cuenta de cobro.
          </p>
          <div className="mt-4">
            <EncargosComisionTable
              encargos={form.encargos}
              subregiones={subregionesQuery.data ?? []}
              municipios={municipiosQuery.data ?? []}
              disabled={isFormDisabled}
              onChange={(encargos) => setForm((current) => ({ ...current, encargos }))}
            />
          </div>
        </div>

        <div className="grid gap-4">
          <FormField
            label="Cumplimiento de objetivos"
            type="textarea"
            rows={4}
            value={form.cumplimientoObjetivos ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                cumplimientoObjetivos: event.target.value,
              }))
            }
            placeholder="Describe los resultados obtenidos en la comisión de viaje."
            disabled={isFormDisabled}
          />
          <FormField
            label="Observaciones"
            type="textarea"
            rows={3}
            value={form.observaciones ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                observaciones: event.target.value,
              }))
            }
            placeholder="Observaciones adicionales (opcional)."
            disabled={isFormDisabled}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <ActionButton
            type="button"
            variant="secondary"
            label="Cancelar"
            onClick={onClose}
            disabled={loading}
          />
          <ActionButton
            type="button"
            variant="primary"
            label="Guardar"
            onClick={handleSave}
            disabled={isFormDisabled || Boolean(prefillsError)}
            loading={loading}
          />
        </div>
      </div>
    </Modal>
  );
}
