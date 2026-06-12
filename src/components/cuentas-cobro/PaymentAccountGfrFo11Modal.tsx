"use client";

import { useEffect, useMemo, useState } from "react";
import ActionButton from "@/components/buttons/ActionButton";
import CurrencyFormField from "@/components/forms/CurrencyFormField";
import ToggleSwitch from "@/components/forms/ToggleSwitch";
import Modal from "@/components/modals/Modal";
import {
  computeGfrFo11ThresholdAnswer,
  GFR_FO_11_UVT_THRESHOLD,
} from "@/lib/cuentas-cobro/gfrFo11Responses";
import type { GfrFo11ConfigMeta, GfrFo11Responses } from "@/types/contratos";
import { formatCurrency } from "@/utils/formatters";

type PaymentAccountGfrFo11ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialResponses?: GfrFo11Responses | null;
  config: GfrFo11ConfigMeta;
  disabled?: boolean;
  onSave: (responses: GfrFo11Responses) => void | Promise<void>;
  loading?: boolean;
};

const defaultResponses: GfrFo11Responses = {
  ingresosAnioAnterior: 0,
  ingresosAnioActual: 0,
  multiplesEstablecimientos: false,
  establecimientoDesarrolloActividad: false,
  usuarioAduanero: false,
  contratosServiciosAnioAnterior: 0,
  contratosServiciosAnioActual: 0,
  contratosEstadoAnioAnterior: 0,
  contratosEstadoAnioActual: 0,
  consignacionesAnioAnterior: 0,
  consignacionesAnioActual: 0,
  regimenSimple: false,
};

function ThresholdPreview({
  label,
  monto,
  uvt,
}: {
  label: string;
  monto: number;
  uvt: number;
}) {
  const threshold = GFR_FO_11_UVT_THRESHOLD * uvt;
  const answer = computeGfrFo11ThresholdAnswer(monto, uvt);

  return (
    <p className="text-xs leading-5 text-muted-foreground">
      {label}: umbral {formatCurrency(threshold)} ({GFR_FO_11_UVT_THRESHOLD} UVT ×{" "}
      {uvt.toLocaleString("es-CO")}) →{" "}
      <span className="font-semibold text-foreground">
        {answer ? "Sí" : "No"}
      </span>
    </p>
  );
}

function AmountPairSection({
  title,
  description,
  anioAnterior,
  anioActual,
  uvtAnterior,
  uvtActual,
  valueAnterior,
  valueActual,
  onChangeAnterior,
  onChangeActual,
  disabled,
}: {
  title: string;
  description: string;
  anioAnterior: number;
  anioActual: number;
  uvtAnterior: number;
  uvtActual: number;
  valueAnterior: number;
  valueActual: number;
  onChangeAnterior: (value: number) => void;
  onChangeActual: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <section className="grid gap-4 rounded-3xl border border-border/70 bg-muted/20 p-4">
      <div>
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <CurrencyFormField
            label={`Monto ${anioAnterior}`}
            name={`${title}-${anioAnterior}`}
            value={valueAnterior}
            onChange={(_, value) => onChangeAnterior(value)}
            disabled={disabled}
          />
          <ThresholdPreview
            label="Respuesta automática"
            monto={valueAnterior}
            uvt={uvtAnterior}
          />
        </div>
        <div className="grid gap-2">
          <CurrencyFormField
            label={`Monto ${anioActual}`}
            name={`${title}-${anioActual}`}
            value={valueActual}
            onChange={(_, value) => onChangeActual(value)}
            disabled={disabled}
          />
          <ThresholdPreview
            label="Respuesta automática"
            monto={valueActual}
            uvt={uvtActual}
          />
        </div>
      </div>
    </section>
  );
}

export default function PaymentAccountGfrFo11Modal({
  isOpen,
  onClose,
  initialResponses,
  config,
  disabled = false,
  onSave,
  loading = false,
}: PaymentAccountGfrFo11ModalProps) {
  const [responses, setResponses] = useState<GfrFo11Responses>(defaultResponses);

  useEffect(() => {
    if (!isOpen) return;
    setResponses(initialResponses ?? defaultResponses);
  }, [isOpen, initialResponses]);

  const updateField = <K extends keyof GfrFo11Responses>(
    key: K,
    value: GfrFo11Responses[K]
  ) => {
    setResponses((current) => ({ ...current, [key]: value }));
  };

  const configSummary = useMemo(
    () =>
      `UVT ${config.anioAnterior}: ${config.uvtAnioAnterior.toLocaleString("es-CO")} · UVT ${config.anioActual}: ${config.uvtAnioActual.toLocaleString("es-CO")}`,
    [config]
  );

  const handleSave = async () => {
    await onSave(responses);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Certificado GFR-FO-11"
      tamaño="xl"
    >
      <div className="grid gap-6">
        <p className="text-sm leading-6 text-muted-foreground">
          Certificado de responsable de IVA. Solo aplica a la primera cuenta de
          cobro del contrato. Las preguntas con montos calculan automáticamente
          Sí/No según el umbral de {GFR_FO_11_UVT_THRESHOLD} UVT.
        </p>
        <p className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-xs font-semibold text-foreground">
          {configSummary}
        </p>

        <AmountPairSection
          title="1. Ingresos brutos totales"
          description="He obtenido ingresos brutos totales provenientes de la actividad en el año anterior o en el año en curso."
          anioAnterior={config.anioAnterior}
          anioActual={config.anioActual}
          uvtAnterior={config.uvtAnioAnterior}
          uvtActual={config.uvtAnioActual}
          valueAnterior={responses.ingresosAnioAnterior}
          valueActual={responses.ingresosAnioActual}
          onChangeAnterior={(value) => updateField("ingresosAnioAnterior", value)}
          onChangeActual={(value) => updateField("ingresosAnioActual", value)}
          disabled={disabled || loading}
        />

        <section className="grid gap-4 rounded-3xl border border-border/70 bg-muted/20 p-4">
          <ToggleSwitch
            label="2. Tiene más de un establecimiento de comercio, oficina, sede, local o negocio donde ejerzan su actividad"
            value={responses.multiplesEstablecimientos}
            disabled={disabled || loading}
            onChange={(value) => updateField("multiplesEstablecimientos", value)}
          />
          <ToggleSwitch
            label="3. Tiene un establecimiento de comercio, oficina, sede, local o negocio donde se desarrolla su actividad"
            value={responses.establecimientoDesarrolloActividad}
            disabled={disabled || loading}
            onChange={(value) =>
              updateField("establecimientoDesarrolloActividad", value)
            }
          />
          <ToggleSwitch
            label="4. Es usuario aduanero"
            value={responses.usuarioAduanero}
            disabled={disabled || loading}
            onChange={(value) => updateField("usuarioAduanero", value)}
          />
        </section>

        <AmountPairSection
          title="5. Contratos de prestación de servicios"
          description="Ha celebrado en el año inmediatamente anterior o en el año en curso contratos de prestación de servicios."
          anioAnterior={config.anioAnterior}
          anioActual={config.anioActual}
          uvtAnterior={config.uvtAnioAnterior}
          uvtActual={config.uvtAnioActual}
          valueAnterior={responses.contratosServiciosAnioAnterior}
          valueActual={responses.contratosServiciosAnioActual}
          onChangeAnterior={(value) =>
            updateField("contratosServiciosAnioAnterior", value)
          }
          onChangeActual={(value) =>
            updateField("contratosServiciosAnioActual", value)
          }
          disabled={disabled || loading}
        />

        <AmountPairSection
          title="6. Contratos con entidades del Estado"
          description="Ha suscrito contratos con entidades del estado en el año inmediatamente anterior o en el año en curso."
          anioAnterior={config.anioAnterior}
          anioActual={config.anioActual}
          uvtAnterior={config.uvtAnioAnterior}
          uvtActual={config.uvtAnioActual}
          valueAnterior={responses.contratosEstadoAnioAnterior}
          valueActual={responses.contratosEstadoAnioActual}
          onChangeAnterior={(value) =>
            updateField("contratosEstadoAnioAnterior", value)
          }
          onChangeActual={(value) => updateField("contratosEstadoAnioActual", value)}
          disabled={disabled || loading}
        />

        <AmountPairSection
          title="7. Consignaciones bancarias"
          description="El monto de sus consignaciones bancarias, depósitos o inversiones financieras superó la suma de 3.500 UVT."
          anioAnterior={config.anioAnterior}
          anioActual={config.anioActual}
          uvtAnterior={config.uvtAnioAnterior}
          uvtActual={config.uvtAnioActual}
          valueAnterior={responses.consignacionesAnioAnterior}
          valueActual={responses.consignacionesAnioActual}
          onChangeAnterior={(value) =>
            updateField("consignacionesAnioAnterior", value)
          }
          onChangeActual={(value) => updateField("consignacionesAnioActual", value)}
          disabled={disabled || loading}
        />

        <section className="rounded-3xl border border-border/70 bg-muted/20 p-4">
          <ToggleSwitch
            label="8. Está registrado como contribuyente del impuesto unificado bajo el Régimen Simple de Tributación (Simple)"
            value={responses.regimenSimple}
            disabled={disabled || loading}
            onChange={(value) => updateField("regimenSimple", value)}
          />
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <ActionButton
            type="button"
            variant="outline"
            label="Cancelar"
            onClick={onClose}
            disabled={disabled || loading}
          />
          <ActionButton
            type="button"
            variant="primary"
            label={initialResponses ? "Actualizar certificado" : "Guardar certificado"}
            loading={loading}
            disabled={disabled}
            onClick={() => void handleSave()}
          />
        </div>
      </div>
    </Modal>
  );
}
