import { parseDateOnlyToUtcNoon } from "@/utils/date";

export type PaymentAccountPreview = {
  numero: number;
  periodoInicio: Date;
  periodoFin: Date;
  diasPagables: number;
  valor: number;
};

function lastDayOfUtcMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0, 12, 0, 0, 0)).getUTCDate();
}

function utcMonthStart(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 1, 12, 0, 0, 0));
}

function utcMonthEnd(year: number, month: number): Date {
  return new Date(
    Date.UTC(year, month, lastDayOfUtcMonth(year, month), 12, 0, 0, 0)
  );
}

function isFullCalendarMonthSegment(start: Date, end: Date): boolean {
  return (
    start.getUTCDate() === 1 &&
    end.getUTCDate() ===
      lastDayOfUtcMonth(start.getUTCFullYear(), start.getUTCMonth()) &&
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === end.getUTCMonth()
  );
}

/**
 * Conteo de días con convención 30/360 (NASD): cada mes vale 30 días.
 * `end` se interpreta de forma exclusiva.
 */
function days360(start: Date, end: Date): number {
  let d1 = start.getUTCDate();
  let d2 = end.getUTCDate();
  if (d1 === 31) d1 = 30;
  if (d2 === 31 && d1 === 30) d2 = 30;
  return (
    (end.getUTCFullYear() - start.getUTCFullYear()) * 360 +
    (end.getUTCMonth() - start.getUTCMonth()) * 30 +
    (d2 - d1)
  );
}

/**
 * Días pagables de un segmento (máx. 30/mes) usando mes contable de 30 días:
 * - Mes calendario completo → 30.
 * - Primer mes parcial (arranca después del día 1) → paga desde el día de inicio
 *   hasta fin de mes contable: `31 - díaInicio` (ej. inicia el 29 → 2 días).
 * - Último mes parcial → la fecha final es el aniversario (exclusiva), por lo que
 *   paga los días `[1 .. díaFin - 1]` (ej. termina el 29 → 28 días).
 *
 * Así el primer y último mes se complementan a 30 en contratos de aniversario y la
 * suma total de días equivale a `plazo × 30`, sin inflar ninguna cuenta.
 */
export function getPayableDays(
  periodoInicio: Date,
  periodoFin: Date,
  isFirstSegment: boolean,
  isLastSegment: boolean
): number {
  if (isFullCalendarMonthSegment(periodoInicio, periodoFin)) return 30;

  const startDay = periodoInicio.getUTCDate();
  const endDay = periodoFin.getUTCDate();

  if (isFirstSegment && isLastSegment) {
    return Math.max(0, Math.min(30, days360(periodoInicio, periodoFin)));
  }

  if (isFirstSegment && startDay !== 1) {
    return Math.min(30, 31 - startDay);
  }

  if (isLastSegment) {
    return Math.max(0, Math.min(30, endDay - 1));
  }

  return Math.max(0, Math.min(30, days360(periodoInicio, periodoFin)));
}

/**
 * Reparte `valorTotal` con honorario mensual fijo (`valorTotal / plazoMeses`):
 * cada cuenta cobra `valorMensual × díasPagables / 30` (mes contable de 30 días) y
 * la última toma el remanente exacto para que la suma cuadre con `valorTotal`. Así
 * los meses completos siempre valen el honorario mensual del contrato y los meses
 * parciales cobran su fracción.
 */
export function distributeByMonthly(
  valorTotal: number,
  plazoMeses: number,
  diasList: readonly number[]
): number[] {
  if (diasList.length === 0) return [];

  const plazo = Math.max(1, Math.round(plazoMeses));
  const valorMensual = valorTotal / plazo;

  const valores = diasList.map((dias) =>
    Math.round((valorMensual * dias) / 30)
  );

  const lastIdx = diasList.length - 1;
  const sumExceptLast = valores
    .slice(0, lastIdx)
    .reduce((sum, valor) => sum + valor, 0);
  valores[lastIdx] = valorTotal - sumExceptLast;

  return valores;
}

export function getPayableDaysForAccountAtIndex(
  account: { periodoInicio: Date | null; periodoFin: Date | null },
  index: number,
  totalAccounts: number
): number {
  if (!account.periodoInicio || !account.periodoFin) return 0;

  return getPayableDays(
    account.periodoInicio,
    account.periodoFin,
    index === 0,
    index === totalAccounts - 1
  );
}

export function mapPayableDaysByAccountNumero<
  T extends {
    numero: number;
    periodoInicio: Date | null;
    periodoFin: Date | null;
  },
>(accounts: readonly T[]): Map<number, number> {
  const sorted = [...accounts].sort((a, b) => a.numero - b.numero);
  const total = sorted.length;

  return new Map(
    sorted.map((account, index) => [
      account.numero,
      getPayableDaysForAccountAtIndex(account, index, total),
    ])
  );
}

export function getTotalContractPayableDays<
  T extends {
    numero: number;
    periodoInicio: Date | null;
    periodoFin: Date | null;
  },
>(accounts: readonly T[]): number {
  return [...mapPayableDaysByAccountNumero(accounts).values()].reduce(
    (sum, days) => sum + days,
    0
  );
}

export function buildPaymentAccountPreviews({
  fechaActaInicio,
  fechaFinal,
  plazoMeses,
  valorTotal,
}: {
  fechaActaInicio: string;
  fechaFinal: string;
  plazoMeses: number;
  valorTotal: number;
}): PaymentAccountPreview[] {
  const start = parseDateOnlyToUtcNoon(fechaActaInicio);
  const end = parseDateOnlyToUtcNoon(fechaFinal);
  const plazo = Math.max(1, Math.round(plazoMeses));
  if (!start || !end || end < start || plazo < 1 || valorTotal <= 0) return [];

  const segments: Array<{ periodoInicio: Date; periodoFin: Date }> = [];
  let year = start.getUTCFullYear();
  let month = start.getUTCMonth();

  while (true) {
    const monthStart = utcMonthStart(year, month);
    const monthEnd = utcMonthEnd(year, month);

    if (monthEnd < start) {
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
      continue;
    }

    if (monthStart > end) break;

    segments.push({
      periodoInicio: start > monthStart ? start : monthStart,
      periodoFin: end < monthEnd ? end : monthEnd,
    });

    if (monthEnd >= end) break;
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  const diasList = segments.map((segment, index) =>
    getPayableDays(
      segment.periodoInicio,
      segment.periodoFin,
      index === 0,
      index === segments.length - 1
    )
  );
  const valores = distributeByMonthly(valorTotal, plazoMeses, diasList);

  return segments.map((segment, index) => ({
    numero: index + 1,
    periodoInicio: segment.periodoInicio,
    periodoFin: segment.periodoFin,
    diasPagables: diasList[index],
    valor: valores[index],
  }));
}
