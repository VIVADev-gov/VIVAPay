"use client";

import { useState } from "react";
import ActionButton from "@/components/buttons/ActionButton";
import CurrencyFormField from "@/components/forms/CurrencyFormField";
import FormField from "@/components/forms/FormField";
import { useCreateContratoMutation } from "@/hooks/api/useContratos";
import { useUiStore } from "@/store/ui/ui-store";
import type { CreateContratoBody } from "@/types/contratos";
import { calculatePlazoMeses } from "@/utils/date";

const initialForm: CreateContratoBody = {
  numeroContrato: "",
  objeto: "",
  plazoMeses: 0,
  fechaActaInicio: "",
  fechaFinal: "",
  concepto: "",
  rubro: "",
  cdp: "",
  valorCdp: 0,
  rpc: "",
  valorRpc: 0,
  valorInicialContrato: 0,
  numeroDisponibilidad: "",
  numeroCompromiso: "",
};

const PLAZO_HELPER =
  "Calculado automáticamente según las fechas de inicio y final";

function withPlazoFromDates(
  form: CreateContratoBody,
  fechaActaInicio: string,
  fechaFinal: string
): CreateContratoBody {
  const plazo = calculatePlazoMeses(fechaActaInicio, fechaFinal);
  return {
    ...form,
    fechaActaInicio,
    fechaFinal,
    plazoMeses: plazo ?? 0,
  };
}

type ContractCreateFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function ContractCreateForm({
  onSuccess,
  onCancel,
}: ContractCreateFormProps) {
  const createMutation = useCreateContratoMutation();
  const showToast = useUiStore((s) => s.showToast);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;
    setForm((current) => {
      const next: CreateContratoBody = {
        ...current,
        [name]: value,
      };

      if (name === "fechaActaInicio" || name === "fechaFinal") {
        return withPlazoFromDates(
          next,
          name === "fechaActaInicio" ? value : next.fechaActaInicio,
          name === "fechaFinal" ? value : next.fechaFinal
        );
      }

      return next;
    });
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleCurrencyChange = (name: string, value: number) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const validateClient = () => {
    const next: Record<string, string> = {};
    if (!form.numeroContrato.trim()) next.numeroContrato = "Requerido";
    if (!form.objeto.trim()) next.objeto = "Requerido";
    if (!form.fechaActaInicio) next.fechaActaInicio = "Requerido";
    if (!form.fechaFinal) next.fechaFinal = "Requerido";
    if (
      form.fechaActaInicio &&
      form.fechaFinal &&
      new Date(form.fechaFinal) < new Date(form.fechaActaInicio)
    ) {
      next.fechaFinal = "Debe ser posterior a la fecha de inicio";
    }
    if (
      form.fechaActaInicio &&
      form.fechaFinal &&
      new Date(form.fechaFinal) >= new Date(form.fechaActaInicio) &&
      (!form.plazoMeses || form.plazoMeses < 1)
    ) {
      next.plazoMeses = "Selecciona fechas válidas para calcular el plazo";
    }
    if (!form.valorInicialContrato || form.valorInicialContrato <= 0) {
      next.valorInicialContrato = "Debe ser mayor a 0";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const plazoHelperText =
    errors.plazoMeses ??
    (form.plazoMeses > 0 ? PLAZO_HELPER : "Completa las fechas para calcular el plazo");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateClient()) return;

    try {
      const result = await createMutation.mutateAsync({
        ...form,
        numeroContrato: form.numeroContrato.trim(),
        objeto: form.objeto.trim(),
        concepto: form.concepto.trim(),
        rubro: form.rubro.trim(),
        cdp: form.cdp.trim(),
        rpc: form.rpc.trim(),
        numeroDisponibilidad: form.numeroDisponibilidad.trim(),
        numeroCompromiso: form.numeroCompromiso.trim(),
        plazoMeses: Number(form.plazoMeses),
        valorCdp: Number(form.valorCdp),
        valorRpc: Number(form.valorRpc),
        valorInicialContrato: Number(form.valorInicialContrato),
      });

      showToast({
        message: `Contrato creado. Se generaron ${result.paymentAccountsGenerated} cuentas de cobro.`,
        variant: "success",
      });
      setForm(initialForm);
      onSuccess?.();
    } catch (error) {
      showToast({
        message:
          error instanceof Error ? error.message : "No se pudo crear el contrato",
        variant: "error",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="No. del contrato"
          name="numeroContrato"
          value={form.numeroContrato}
          onChange={handleChange}
          required
          helperText={errors.numeroContrato}
        />
        <FormField
          label="Fecha acta de inicio"
          name="fechaActaInicio"
          type="date"
          value={form.fechaActaInicio}
          onChange={handleChange}
          required
          helperText={errors.fechaActaInicio}
        />
        <FormField
          label="Fecha final"
          name="fechaFinal"
          type="date"
          value={form.fechaFinal}
          onChange={handleChange}
          required
          helperText={errors.fechaFinal}
        />
        <FormField
          label="Plazo (meses)"
          name="plazoMeses"
          type="number"
          value={form.plazoMeses || ""}
          disabled
          required
          helperText={plazoHelperText}
        />
        <FormField
          label="Concepto"
          name="concepto"
          value={form.concepto}
          onChange={handleChange}
          required
          className="md:col-span-2"
        />
        <FormField
          label="Objeto"
          name="objeto"
          type="textarea"
          rows={3}
          value={form.objeto}
          onChange={handleChange}
          required
          className="md:col-span-2"
          helperText={errors.objeto}
        />
        <FormField
          label="Rubro"
          name="rubro"
          value={form.rubro}
          onChange={handleChange}
          required
        />
        <FormField
          label="CDP"
          name="cdp"
          value={form.cdp}
          onChange={handleChange}
          required
        />
        <CurrencyFormField
          label="Valor CDP"
          name="valorCdp"
          value={form.valorCdp}
          onChange={handleCurrencyChange}
          required
        />
        <FormField
          label="RPC"
          name="rpc"
          value={form.rpc}
          onChange={handleChange}
          required
        />
        <CurrencyFormField
          label="Valor RPC"
          name="valorRpc"
          value={form.valorRpc}
          onChange={handleCurrencyChange}
          required
        />
        <CurrencyFormField
          label="Valor inicial del contrato"
          name="valorInicialContrato"
          value={form.valorInicialContrato}
          onChange={handleCurrencyChange}
          required
          helperText={errors.valorInicialContrato}
          invalid={Boolean(errors.valorInicialContrato)}
        />
        <FormField
          label="No. disponibilidad"
          name="numeroDisponibilidad"
          value={form.numeroDisponibilidad}
          onChange={handleChange}
          required
        />
        <FormField
          label="No. compromiso"
          name="numeroCompromiso"
          value={form.numeroCompromiso}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        {onCancel ? (
          <ActionButton
            type="button"
            variant="outline"
            label="Cancelar"
            onClick={onCancel}
          />
        ) : null}
        <ActionButton
          type="submit"
          variant="primary"
          label={createMutation.isPending ? "Creando..." : "Crear contrato"}
          loading={createMutation.isPending}
        />
      </div>
    </form>
  );
}
