import { computeGfrFo17EjecucionPorcentajes } from "@/lib/forms/excel/build/gfrFo17Ejecucion";
import { parseDateOnlyToUtcNoon } from "@/utils/date";

export type PaymentAccountEjecucionGfrFo17Manuales = {
  financiera: number;
  fisica: number;
};

export type PaymentAccountEjecucionGfrFo17Resolved = {
  sugerida: PaymentAccountEjecucionGfrFo17Manuales;
  efectiva: PaymentAccountEjecucionGfrFo17Manuales;
  manuales: PaymentAccountEjecucionGfrFo17Manuales | null;
  esPersonalizada: boolean;
};

export type PaymentAccountEjecucionGfrFo17Input = {
  numero: number;
  valor: number | null;
  periodoInicio?: string | Date | null;
  periodoFin?: string | Date | null;
  ejecucionGfrFo17Manuales?: PaymentAccountEjecucionGfrFo17Manuales | null;
};

function parsePercent(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return null;
  return Math.round(parsed * 100) / 100;
}

export function parsePaymentAccountEjecucionGfrFo17Manuales(
  value: unknown
): PaymentAccountEjecucionGfrFo17Manuales | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const financiera = parsePercent(record.financiera);
  const fisica = parsePercent(record.fisica);

  if (financiera === null && fisica === null) return null;

  const porcentaje = fisica ?? financiera;
  if (porcentaje === null) return null;

  return { financiera: porcentaje, fisica: porcentaje };
}

function toDateValue(value?: string | Date | null) {
  if (!value) return null;
  if (value instanceof Date) return value;
  return parseDateOnlyToUtcNoon(value);
}

function toEjecucionSnapshots(accounts: readonly PaymentAccountEjecucionGfrFo17Input[]) {
  return accounts.map((account) => ({
    numero: account.numero,
    periodoInicio: toDateValue(account.periodoInicio) ?? null,
    periodoFin: toDateValue(account.periodoFin) ?? null,
  }));
}

function fractionToPercent(fraction: number) {
  return Math.round(fraction * 10_000) / 100;
}

function percentToFraction(percent: number) {
  return percent / 100;
}

export function computeSuggestedEjecucionGfrFo17(
  paymentAccount: Pick<PaymentAccountEjecucionGfrFo17Input, "numero">,
  paymentAccounts: readonly PaymentAccountEjecucionGfrFo17Input[]
): PaymentAccountEjecucionGfrFo17Manuales {
  const snapshots = toEjecucionSnapshots(paymentAccounts);
  const current = snapshots.find((account) => account.numero === paymentAccount.numero);
  if (!current) {
    return { financiera: 0, fisica: 0 };
  }

  const computed = computeGfrFo17EjecucionPorcentajes({
    paymentAccounts: snapshots,
    paymentAccount: current,
  });

  return {
    financiera: fractionToPercent(computed.financiera),
    fisica: fractionToPercent(computed.fisica),
  };
}

export function resolvePaymentAccountEjecucionGfrFo17(
  paymentAccount: PaymentAccountEjecucionGfrFo17Input,
  paymentAccounts: readonly PaymentAccountEjecucionGfrFo17Input[]
): PaymentAccountEjecucionGfrFo17Resolved {
  const sugerida = computeSuggestedEjecucionGfrFo17(paymentAccount, paymentAccounts);
  const manuales = parsePaymentAccountEjecucionGfrFo17Manuales(
    paymentAccount.ejecucionGfrFo17Manuales
  );
  const esPersonalizada = manuales !== null;
  const efectiva = manuales ?? sugerida;

  return {
    sugerida,
    efectiva,
    manuales,
    esPersonalizada,
  };
}

export function resolveEjecucionFractionsForPdf(
  paymentAccount: PaymentAccountEjecucionGfrFo17Input,
  paymentAccounts: readonly PaymentAccountEjecucionGfrFo17Input[]
) {
  const resolved = resolvePaymentAccountEjecucionGfrFo17(
    paymentAccount,
    paymentAccounts
  );

  return {
    financiera: percentToFraction(resolved.efectiva.financiera),
    fisica: percentToFraction(resolved.efectiva.fisica),
  };
}

export function resolveAllPaymentAccountsEjecucionGfrFo17(
  paymentAccounts: readonly PaymentAccountEjecucionGfrFo17Input[]
) {
  return [...paymentAccounts]
    .sort((left, right) => left.numero - right.numero)
    .map((paymentAccount) => ({
      numero: paymentAccount.numero,
      ...resolvePaymentAccountEjecucionGfrFo17(paymentAccount, paymentAccounts),
    }));
}

export function ejecucionGfrFo17MatchesSuggested(
  current: PaymentAccountEjecucionGfrFo17Manuales,
  suggested: PaymentAccountEjecucionGfrFo17Manuales
) {
  return (
    current.financiera === suggested.financiera &&
    current.fisica === suggested.fisica
  );
}

export function buildPaymentAccountEjecucionGfrFo17Payload(input: {
  porcentaje: number;
  suggested: PaymentAccountEjecucionGfrFo17Manuales;
}): {
  ejecucionGfrFo17Manuales: PaymentAccountEjecucionGfrFo17Manuales | null;
  error: string | null;
} {
  const porcentaje = parsePercent(input.porcentaje);

  if (porcentaje === null) {
    return {
      ejecucionGfrFo17Manuales: null,
      error: "El porcentaje de ejecución debe estar entre 0 y 100",
    };
  }

  const current = { financiera: porcentaje, fisica: porcentaje };
  if (ejecucionGfrFo17MatchesSuggested(current, input.suggested)) {
    return { ejecucionGfrFo17Manuales: null, error: null };
  }

  return { ejecucionGfrFo17Manuales: current, error: null };
}

export function getEjecucionGfrFo17Porcentaje(
  resolved: PaymentAccountEjecucionGfrFo17Resolved
) {
  return resolved.efectiva.fisica;
}

export function formatEjecucionGfrFo17Percent(value: number) {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(2)}%`;
}

export function formatEjecucionGfrFo17Summary(
  resolved: PaymentAccountEjecucionGfrFo17Resolved
) {
  const porcentaje = formatEjecucionGfrFo17Percent(
    getEjecucionGfrFo17Porcentaje(resolved)
  );
  return resolved.esPersonalizada
    ? `${porcentaje} (personalizado)`
    : porcentaje;
}
