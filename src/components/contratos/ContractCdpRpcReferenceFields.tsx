"use client";

import FormField from "@/components/forms/FormField";
import {
  buildCdpRpcReference,
  sanitizeCdpRpcNumero,
  type CdpRpcReferenceFormValue,
} from "@/lib/contratos/cdpRpcReference";

type ContractCdpRpcReferenceFieldsProps = {
  value: CdpRpcReferenceFormValue;
  errors?: Record<string, string>;
  onChange: (patch: Partial<CdpRpcReferenceFormValue>) => void;
};

export default function ContractCdpRpcReferenceFields({
  value,
  errors = {},
  onChange,
}: ContractCdpRpcReferenceFieldsProps) {
  const cdpPreview = buildCdpRpcReference(value.cdpNumero, value.cdpFecha);
  const rpcPreview = buildCdpRpcReference(value.rpcNumero, value.rpcFecha);

  return (
    <>
      <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
        <FormField
          label="Número CDP"
          name="cdpNumero"
          inputMode="numeric"
          value={value.cdpNumero}
          onChange={(event) =>
            onChange({
              cdpNumero: sanitizeCdpRpcNumero(event.target.value),
            })
          }
          required
          helperText={errors.cdpNumero ?? (cdpPreview || undefined)}
        />
        <FormField
          label="Fecha CDP"
          name="cdpFecha"
          type="date"
          value={value.cdpFecha}
          onChange={(event) => onChange({ cdpFecha: event.target.value })}
          required
          helperText={errors.cdpFecha}
        />
      </div>

      <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
        <FormField
          label="Número RCP"
          name="rpcNumero"
          inputMode="numeric"
          value={value.rpcNumero}
          onChange={(event) =>
            onChange({
              rpcNumero: sanitizeCdpRpcNumero(event.target.value),
            })
          }
          required
          helperText={
            errors.rpcNumero ??
            (rpcPreview ||
              "Este número se usará también como No. de disponibilidad y No. de compromiso.")
          }
        />
        <FormField
          label="Fecha RCP"
          name="rpcFecha"
          type="date"
          value={value.rpcFecha}
          onChange={(event) => onChange({ rpcFecha: event.target.value })}
          required
          helperText={errors.rpcFecha}
        />
      </div>
    </>
  );
}
