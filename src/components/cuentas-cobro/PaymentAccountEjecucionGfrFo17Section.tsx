"use client";

import { useEffect, useMemo, useState } from "react";
import ActionButton from "@/components/buttons/ActionButton";
import FormField from "@/components/forms/FormField";
import {
  buildPaymentAccountEjecucionGfrFo17Payload,
  formatEjecucionGfrFo17Percent,
  getEjecucionGfrFo17Porcentaje,
  resolveAllPaymentAccountsEjecucionGfrFo17,
  resolvePaymentAccountEjecucionGfrFo17,
  type PaymentAccountEjecucionGfrFo17Input,
} from "@/lib/cuentas-cobro/paymentAccountEjecucionGfrFo17";
import type { PublicCuentaCobro } from "@/types/contratos";
import { ChevronDown } from "lucide-react";

type PaymentAccountEjecucionGfrFo17SectionProps = {
  paymentAccount: PublicCuentaCobro;
  paymentAccounts: readonly PublicCuentaCobro[];
  readOnly?: boolean;
  loading?: boolean;
  onSave?: (payload: { porcentaje: number }) => Promise<void>;
};

function toEjecucionInput(
  account: PublicCuentaCobro
): PaymentAccountEjecucionGfrFo17Input {
  return {
    numero: account.numero,
    valor: account.valor,
    periodoInicio: account.periodoInicio,
    periodoFin: account.periodoFin,
    ejecucionGfrFo17Manuales: account.ejecucionGfrFo17Manuales,
  };
}

function formatPercentInput(value: number) {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

export default function PaymentAccountEjecucionGfrFo17Section({
  paymentAccount,
  paymentAccounts,
  readOnly = false,
  loading = false,
  onSave,
}: PaymentAccountEjecucionGfrFo17SectionProps) {
  const inputs = useMemo(
    () => paymentAccounts.map(toEjecucionInput),
    [paymentAccounts]
  );
  const currentInput = useMemo(
    () => toEjecucionInput(paymentAccount),
    [paymentAccount]
  );

  const resolved = useMemo(
    () => resolvePaymentAccountEjecucionGfrFo17(currentInput, inputs),
    [currentInput, inputs]
  );
  const allAccounts = useMemo(
    () => resolveAllPaymentAccountsEjecucionGfrFo17(inputs),
    [inputs]
  );

  const porcentajeEfectivo = getEjecucionGfrFo17Porcentaje(resolved);
  const porcentajeSugerido = getEjecucionGfrFo17Porcentaje({
    ...resolved,
    efectiva: resolved.sugerida,
    manuales: null,
    esPersonalizada: false,
  });

  const [porcentaje, setPorcentaje] = useState(
    formatPercentInput(porcentajeEfectivo)
  );
  const [showAllAccounts, setShowAllAccounts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPorcentaje(formatPercentInput(porcentajeEfectivo));
    setError(null);
  }, [paymentAccount.numero, porcentajeEfectivo]);

  const porcentajeDraft = Number(porcentaje);
  const usesManualValues = resolved.esPersonalizada;
  const hasUnsavedChanges = porcentajeDraft !== porcentajeEfectivo;
  const isCustomDraft = porcentajeDraft !== porcentajeSugerido;

  const handleRestoreSuggested = () => {
    setPorcentaje(formatPercentInput(porcentajeSugerido));
    setError(null);
  };

  const handleSave = async () => {
    const { error: validationError } = buildPaymentAccountEjecucionGfrFo17Payload({
      porcentaje: porcentajeDraft,
      suggested: resolved.sugerida,
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    await onSave?.({ porcentaje: porcentajeDraft });
  };

  return (
    <div className="grid gap-5">
      <div className="rounded-3xl border border-border/70 bg-muted/20 p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Ejecución física · GFR-FO-17
            </p>
            <p className="mt-2 text-4xl font-black tracking-tight text-foreground">
              {formatEjecucionGfrFo17Percent(porcentajeEfectivo)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Cuenta {paymentAccount.numero} de {paymentAccounts.length}
              {usesManualValues ? " · Personalizado" : " · Calculado"}
            </p>
          </div>

          <div className="w-full sm:max-w-xs">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${Math.min(100, Math.max(0, porcentajeEfectivo))}%`,
                }}
              />
            </div>
            <p className="mt-2 text-right text-xs text-muted-foreground">
              Sugerido: {formatEjecucionGfrFo17Percent(porcentajeSugerido)}
            </p>
          </div>
        </div>

        {!readOnly ? (
          <div className="mt-5 grid gap-4 border-t border-border/60 pt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <FormField
                  id="ejecucion-porcentaje"
                  name="ejecucionPorcentaje"
                  label="Ajustar porcentaje (%)"
                  type="number"
                  inputMode="decimal"
                  value={porcentaje}
                  disabled={loading}
                  onChange={(event) => setPorcentaje(event.target.value)}
                />
              </div>
              {isCustomDraft ? (
                <ActionButton
                  type="button"
                  variant="outline"
                  label="Restaurar"
                  disabled={loading}
                  onClick={handleRestoreSuggested}
                />
              ) : null}
              <ActionButton
                type="button"
                variant="primary"
                label="Guardar"
                loading={loading}
                disabled={!hasUnsavedChanges}
                onClick={() => void handleSave()}
              />
            </div>

            {error ? (
              <p className="text-sm font-semibold text-destructive">{error}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Se aplica el mismo valor en ejecución financiera y física del
                formulario.
              </p>
            )}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border/60 bg-background/60">
        <button
          type="button"
          onClick={() => setShowAllAccounts((open) => !open)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-foreground transition hover:bg-muted/30"
        >
          <span>Ver todas las cuentas ({paymentAccounts.length})</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition ${
              showAllAccounts ? "rotate-180" : ""
            }`}
          />
        </button>

        {showAllAccounts ? (
          <ul className="grid gap-1 border-t border-border/60 px-2 py-2 sm:grid-cols-2 lg:grid-cols-3">
            {allAccounts.map((item) => {
              const isCurrent = item.numero === paymentAccount.numero;
              const value = getEjecucionGfrFo17Porcentaje(item);
              return (
                <li
                  key={item.numero}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                    isCurrent
                      ? "bg-primary/10 font-semibold text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <span>No. {item.numero}</span>
                  <span>{formatEjecucionGfrFo17Percent(value)}</span>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
