"use client";

import { useState } from "react";
import ActionButton from "@/components/buttons/ActionButton";
import CurrencyFormField from "@/components/forms/CurrencyFormField";
import FileUpload from "@/components/forms/FileUpload";
import FormField from "@/components/forms/FormField";
import ToggleSwitch from "@/components/forms/ToggleSwitch";
import { useCreateContratoMutation } from "@/hooks/api/useContratos";
import api from "@/lib/axiosInstance";
import { buildPaymentAccountPreviews } from "@/lib/cuentas-cobro/paymentAccountPreview";
import { useUiStore } from "@/store/ui/ui-store";
import type { CreateContratoBody } from "@/types/contratos";
import { formatCurrency, formatDate } from "@/utils/formatters";
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
  submittedPaymentAccountsCount: 0,
};

const PLAZO_HELPER =
  "Calculado automáticamente según las fechas de inicio y final";

const CONTRACT_DOCUMENTS = [
  {
    tipoDocumento: "CONTRATO",
    label: "Contrato",
    helperText: "Documento reutilizable del contrato.",
  },
  {
    tipoDocumento: "ACTA_INICIO",
    label: "Acta de inicio",
    helperText: "Documento base reutilizable del contrato.",
  },
  {
    tipoDocumento: "POLIZA_FIRMADA",
    label: "Póliza firmada",
    helperText: "Reutilizable; subir nueva si hubo prórroga o adición.",
  },
  {
    tipoDocumento: "CERTIFICADO_APROBACION_POLIZA",
    label: "Certificado de aprobación de póliza",
    helperText: "Documento reutilizable del contrato.",
  },
  {
    tipoDocumento: "RUT",
    label: "RUT",
    helperText: "Documento reutilizable del contrato. Debe estar actualizado.",
  },
  {
    tipoDocumento: "CERTIFICACION_BANCARIA",
    label: "Certificación bancaria",
    helperText: "Documento reutilizable; reemplazar si cambia la cuenta bancaria.",
  },
] as const;

type ContractDocumentType = (typeof CONTRACT_DOCUMENTS)[number]["tipoDocumento"];

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

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
  const [contractFiles, setContractFiles] = useState<
    Partial<Record<ContractDocumentType, File>>
  >({});

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;
    setForm((current) => {
      const next: CreateContratoBody = {
        ...current,
        [name]:
          name === "submittedPaymentAccountsCount"
            ? value === ""
              ? 0
              : Number(value)
            : value,
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
    if (
      form.submittedPaymentAccountsCount != null &&
      form.submittedPaymentAccountsCount < 0
    ) {
      next.submittedPaymentAccountsCount = "No puede ser negativo";
    }
    for (const document of CONTRACT_DOCUMENTS) {
      if (!contractFiles[document.tipoDocumento]) {
        next[`document_${document.tipoDocumento}`] = "Requerido";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const plazoHelperText =
    errors.plazoMeses ??
    (form.plazoMeses > 0 ? PLAZO_HELPER : "Completa las fechas para calcular el plazo");

  const paymentPreviews = buildPaymentAccountPreviews({
    fechaActaInicio: form.fechaActaInicio,
    fechaFinal: form.fechaFinal,
    plazoMeses: Number(form.plazoMeses),
    valorTotal: Number(form.valorInicialContrato),
  });

  const setSubmittedCountFromToggle = (numero: number, checked: boolean) => {
    setForm((current) => ({
      ...current,
      submittedPaymentAccountsCount: checked ? numero : Math.max(0, numero - 1),
    }));
  };

  const uploadContractDocuments = async (contractId: string) => {
    for (const document of CONTRACT_DOCUMENTS) {
      const file = contractFiles[document.tipoDocumento];
      if (!file) continue;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("tipoDocumento", document.tipoDocumento);
      formData.append("required", "true");

      const { data } = await api.post<ApiResponse<unknown>>(
        `/api/cuentas-cobro/contrato/${contractId}/documentos`,
        formData
      );
      if (!data.success) throw new Error(data.message);
    }
  };

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
        submittedPaymentAccountsCount: Number(
          form.submittedPaymentAccountsCount ?? 0
        ),
      });

      showToast({
        message: `Contrato creado. Se generaron ${result.paymentAccountsGenerated} cuentas de cobro${
          result.paymentAccountsRegularized
            ? ` y ${result.paymentAccountsRegularized} quedaron marcadas como enviadas.`
            : "."
        }`,
        variant: "success",
      });
      await uploadContractDocuments(result.contract.id);
      setForm(initialForm);
      setContractFiles({});
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

      <section className="rounded-3xl border border-border/80 bg-muted/20 p-5">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Regularización inicial
          </p>
          <h3 className="mt-2 text-lg font-black text-foreground">
            Cuentas ya enviadas
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Marca en orden las cuentas que ya enviaste manualmente. Si marcas
            una cuenta, se asumen enviadas todas las anteriores.
          </p>
        </div>

        {paymentPreviews.length > 0 ? (
          <div className="grid gap-3">
            {paymentPreviews.map((account) => {
              const checked =
                account.numero <= (form.submittedPaymentAccountsCount ?? 0);
              return (
                <ToggleSwitch
                  key={account.numero}
                  label={`Cuenta ${account.numero} — ${formatDate(
                    account.periodoInicio
                  )} - ${formatDate(account.periodoFin)} — ${formatCurrency(
                    account.valor
                  )}`}
                  description={`${account.diasPagables} días pagables`}
                  value={checked}
                  onChange={(value) =>
                    setSubmittedCountFromToggle(account.numero, value)
                  }
                />
              );
            })}
          </div>
        ) : (
          <p className="rounded-2xl bg-background/80 px-4 py-3 text-sm text-muted-foreground">
            Completa fechas, plazo y valor inicial para ver las cuentas
            generadas.
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-border/80 bg-muted/20 p-5">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Documentos del contrato
          </p>
          <h3 className="mt-2 text-lg font-black text-foreground">
            Archivos reutilizables
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Estos PDFs se guardan en la carpeta del contrato y se reutilizan en
            el proceso de cuentas de cobro.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {CONTRACT_DOCUMENTS.map((document) => (
            <FileUpload
              key={document.tipoDocumento}
              id={`contract-${document.tipoDocumento}`}
              name={document.tipoDocumento}
              label={`${document.label}*`}
              helperText={document.helperText}
              error={errors[`document_${document.tipoDocumento}`]}
              currentFileName={contractFiles[document.tipoDocumento]?.name}
              onChange={(file) => {
                setContractFiles((current) => ({
                  ...current,
                  [document.tipoDocumento]: file ?? undefined,
                }));
                setErrors((current) => ({
                  ...current,
                  [`document_${document.tipoDocumento}`]: "",
                }));
              }}
            />
          ))}
        </div>
      </section>

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
