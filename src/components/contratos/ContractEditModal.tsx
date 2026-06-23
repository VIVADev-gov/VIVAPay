"use client";

import { useEffect, useState } from "react";
import ActionButton from "@/components/buttons/ActionButton";
import ContractCdpRpcReferenceFields from "@/components/contratos/ContractCdpRpcReferenceFields";
import ContractRubrosFields, {
  contractRubrosFromForm,
} from "@/components/contratos/ContractRubrosFields";
import CurrencyFormField from "@/components/forms/CurrencyFormField";
import FormField from "@/components/forms/FormField";
import ToggleSwitch from "@/components/forms/ToggleSwitch";
import Modal from "@/components/modals/Modal";
import { useUpdateContratoMutation } from "@/hooks/api/useContratos";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  buildCdpRpcReference,
  cdpRpcReferenceFromContract,
  EMPTY_CDP_RPC_REFERENCE,
  getCdpRpcReferenceValidationErrors,
} from "@/lib/contratos/cdpRpcReference";
import { formatContractFormErrors } from "@/lib/contratos/formatContractFormErrors";
import { validateRubrosAdicionalesErrors } from "@/lib/contratos/contractRubrosAdicionales";
import { useContratosStore } from "@/store/contratos/contratos.store";
import { useUiStore } from "@/store/ui/ui-store";
import type { PublicCuentaCobro, UpdateContratoBody } from "@/types/contratos";
import type { PublicContrato } from "@/types/contratos";
import { calculatePlazoMeses, toDateOnlyString } from "@/utils/date";

const PLAZO_HELPER =
  "Calculado automáticamente según las fechas de inicio y final";

const BLOCKED_FIELDS_HELPER =
  "No editable porque ya existen cuentas de cobro generadas para este contrato.";

type ContractEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  paymentAccounts?: PublicCuentaCobro[];
};

function contractToForm(contract: PublicContrato): UpdateContratoBody {
  return {
    numeroContrato: contract.numeroContrato,
    objeto: contract.objeto,
    plazoMeses: contract.plazoMeses,
    fechaActaInicio:
      toDateOnlyString(contract.fechaActaInicio) ?? "",
    fechaFinal: toDateOnlyString(contract.fechaFinal) ?? "",
    concepto: contract.concepto,
    rubro: contract.rubro,
    cdp: contract.cdp,
    valorCdp: contract.valorCdp,
    rpc: contract.rpc,
    valorRpc: contract.valorRpc,
    valorInicialContrato: contract.valorInicialContrato,
    numeroDisponibilidad: contract.numeroDisponibilidad,
    numeroCompromiso: contract.numeroCompromiso,
    tieneReembolsables: contract.tieneReembolsables ?? false,
    rubroRembolsable: contract.rubroRembolsable ?? "",
    conceptoRembolsable: contract.conceptoRembolsable ?? "",
    rubrosAdicionales: contract.rubrosAdicionales ?? [],
  };
}

function withPlazoFromDates(
  form: UpdateContratoBody,
  fechaActaInicio: string,
  fechaFinal: string
): UpdateContratoBody {
  const plazo = calculatePlazoMeses(fechaActaInicio, fechaFinal);
  return {
    ...form,
    fechaActaInicio,
    fechaFinal,
    plazoMeses: plazo ?? 0,
  };
}

export default function ContractEditModal({
  isOpen,
  onClose,
  contractId,
  paymentAccounts: paymentAccountsProp = [],
}: ContractEditModalProps) {
  const detail = useContratosStore((s) => s.detail);
  const contract = detail?.contract?.id === contractId ? detail.contract : null;
  const paymentAccounts = detail?.paymentAccounts ?? paymentAccountsProp;
  const updateMutation = useUpdateContratoMutation(contractId);
  const showToast = useUiStore((s) => s.showToast);
  const [form, setForm] = useState<UpdateContratoBody | null>(null);
  const [cdpRpcReference, setCdpRpcReference] = useState(EMPTY_CDP_RPC_REFERENCE);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hasPaymentAccounts = paymentAccounts.length > 0;
  const financialFieldsLocked = hasPaymentAccounts;

  useEffect(() => {
    if (isOpen && contract) {
      setForm(contractToForm(contract));
      setCdpRpcReference(
        cdpRpcReferenceFromContract(contract.cdp, contract.rpc)
      );
      setErrors({});
    } else if (!isOpen) {
      setForm(null);
      setCdpRpcReference(EMPTY_CDP_RPC_REFERENCE);
    }
  }, [isOpen, contract]);

  if (!isOpen || !contract || !form) {
    return null;
  }

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;
    setForm((current) => {
      if (!current) return current;
      const next = { ...current, [name]: value };

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
    setForm((current) => (current ? { ...current, [name]: value } : current));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const getClientValidationErrors = () => {
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
    if (!form.concepto.trim()) next.concepto = "Requerido";
    if (!form.rubro.trim()) next.rubro = "Requerido";
    Object.assign(
      next,
      validateRubrosAdicionalesErrors(form.rubrosAdicionales ?? [])
    );
    Object.assign(next, getCdpRpcReferenceValidationErrors(cdpRpcReference));
    if (!form.valorInicialContrato || form.valorInicialContrato <= 0) {
      next.valorInicialContrato = "Debe ser mayor a 0";
    }
    if (form.tieneReembolsables) {
      if (!form.rubroRembolsable?.trim()) {
        next.rubroRembolsable = "Requerido";
      }
      if (!form.conceptoRembolsable?.trim()) {
        next.conceptoRembolsable = "Requerido";
      }
    }
    return next;
  };

  const plazoHelperText =
    errors.plazoMeses ??
    (financialFieldsLocked
      ? BLOCKED_FIELDS_HELPER
      : form.plazoMeses > 0
        ? PLAZO_HELPER
        : "Completa las fechas para calcular el plazo");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const clientErrors = getClientValidationErrors();
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) {
      showToast({
        message: formatContractFormErrors(clientErrors),
        variant: "warning",
      });
      return;
    }

    try {
      const rubrosPayload = contractRubrosFromForm({
        rubro: form.rubro,
        concepto: form.concepto,
        rubrosAdicionales: form.rubrosAdicionales ?? [],
      });

      const cdp = buildCdpRpcReference(
        cdpRpcReference.cdpNumero,
        cdpRpcReference.cdpFecha
      );
      const rpc = buildCdpRpcReference(
        cdpRpcReference.rpcNumero,
        cdpRpcReference.rpcFecha
      );

      await updateMutation.mutateAsync({
        ...form,
        numeroContrato: form.numeroContrato.trim(),
        objeto: form.objeto.trim(),
        concepto: rubrosPayload.concepto,
        rubro: rubrosPayload.rubro,
        rubrosAdicionales: rubrosPayload.rubrosAdicionales,
        cdp,
        rpc,
        numeroDisponibilidad: rpc,
        numeroCompromiso: rpc,
        plazoMeses: Number(form.plazoMeses),
        valorCdp: Number(form.valorCdp),
        valorRpc: Number(form.valorRpc),
        valorInicialContrato: Number(form.valorInicialContrato),
        tieneReembolsables: form.tieneReembolsables,
        rubroRembolsable: form.tieneReembolsables
          ? form.rubroRembolsable?.trim()
          : undefined,
        conceptoRembolsable: form.tieneReembolsables
          ? form.conceptoRembolsable?.trim()
          : undefined,
      });

      showToast({
        message: "Contrato actualizado correctamente",
        variant: "success",
      });
      onClose();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, "No se pudo actualizar el contrato"),
        variant: "error",
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar contrato"
      tamaño="xl"
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        {financialFieldsLocked ? (
          <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-muted-foreground">
            Este contrato ya tiene cuentas de cobro generadas. Las fechas, el
            plazo y el valor inicial no pueden modificarse.
          </p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
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
        </div>

        <ContractRubrosFields
          value={{
            rubro: form.rubro,
            concepto: form.concepto,
            rubrosAdicionales: form.rubrosAdicionales ?? [],
          }}
          errors={errors}
          onChange={({ rubro, concepto, rubrosAdicionales }) => {
            setForm((current) => {
              if (!current) return current;
              return {
                ...current,
                rubro,
                concepto,
                rubrosAdicionales,
              };
            });
            setErrors((current) => ({
              ...current,
              rubro: "",
              concepto: "",
              ...Object.fromEntries(
                Object.keys(current)
                  .filter((key) => key.startsWith("rubrosAdicionales."))
                  .map((key) => [key, ""])
              ),
            }));
          }}
        />

        {/* Reembolsables deshabilitado temporalmente
        <section className="rounded-3xl border border-border/80 bg-muted/20 p-5">
          <ToggleSwitch
            label="¿Tiene reembolsables?"
            description="Indica si el contrato incluye rubro y concepto reembolsables."
            value={form.tieneReembolsables}
            onChange={(value) => {
              setForm((current) => {
                if (!current) return current;
                return {
                  ...current,
                  tieneReembolsables: value,
                  rubroRembolsable: value ? current.rubroRembolsable : "",
                  conceptoRembolsable: value ? current.conceptoRembolsable : "",
                };
              });
              setErrors((current) => ({
                ...current,
                rubroRembolsable: "",
                conceptoRembolsable: "",
              }));
            }}
          />
          {form.tieneReembolsables ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FormField
                label="Rubro reembolsable"
                name="rubroRembolsable"
                value={form.rubroRembolsable ?? ""}
                onChange={handleChange}
                required
                helperText={errors.rubroRembolsable}
              />
              <FormField
                label="Concepto reembolsable"
                name="conceptoRembolsable"
                value={form.conceptoRembolsable ?? ""}
                onChange={handleChange}
                required
                helperText={errors.conceptoRembolsable}
              />
            </div>
          ) : null}
        </section>
        */}

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
            disabled={financialFieldsLocked}
            helperText={
              errors.fechaActaInicio ??
              (financialFieldsLocked ? BLOCKED_FIELDS_HELPER : undefined)
            }
          />
          <FormField
            label="Fecha final"
            name="fechaFinal"
            type="date"
            value={form.fechaFinal}
            onChange={handleChange}
            required
            disabled={financialFieldsLocked}
            helperText={
              errors.fechaFinal ??
              (financialFieldsLocked ? BLOCKED_FIELDS_HELPER : undefined)
            }
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
          <ContractCdpRpcReferenceFields
            value={cdpRpcReference}
            errors={errors}
            onChange={(patch) => {
              setCdpRpcReference((current) => ({ ...current, ...patch }));
              setErrors((current) => ({
                ...current,
                ...Object.fromEntries(
                  Object.keys(patch).map((key) => [key, ""])
                ),
              }));
            }}
          />
          <CurrencyFormField
            label="Valor certificado de disponibilidad presupuestal (CDP)"
            name="valorCdp"
            value={form.valorCdp}
            onChange={handleCurrencyChange}
            required
          />
          <CurrencyFormField
            label="Valor registro presupuestal del compromiso (RCP)"
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
            disabled={financialFieldsLocked}
            helperText={
              errors.valorInicialContrato ??
              (financialFieldsLocked ? BLOCKED_FIELDS_HELPER : undefined)
            }
            invalid={Boolean(errors.valorInicialContrato)}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <ActionButton
            type="button"
            variant="outline"
            label="Cancelar"
            onClick={onClose}
          />
          <ActionButton
            type="submit"
            variant="primary"
            label={
              updateMutation.isPending ? "Guardando..." : "Guardar cambios"
            }
            loading={updateMutation.isPending}
          />
        </div>
      </form>
    </Modal>
  );
}
