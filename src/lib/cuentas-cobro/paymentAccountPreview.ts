import { parseDateOnlyToUtcNoon } from "@/utils/date";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

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

function calendarDaysInclusive(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
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

function getPayableDays(
  periodoInicio: Date,
  periodoFin: Date,
  isFirstSegment: boolean,
  isLastSegment: boolean
): number {
  const calendarDays = calendarDaysInclusive(periodoInicio, periodoFin);

  if (isFullCalendarMonthSegment(periodoInicio, periodoFin)) return 30;

  if (isFirstSegment && periodoInicio.getUTCDate() !== 1) {
    return Math.min(30, periodoFin.getUTCDate() - periodoInicio.getUTCDate());
  }

  if (
    isLastSegment &&
    periodoFin.getUTCDate() !==
      lastDayOfUtcMonth(periodoFin.getUTCFullYear(), periodoFin.getUTCMonth())
  ) {
    return Math.min(30, calendarDays);
  }

  return Math.min(30, calendarDays);
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

  const monthlyValue = valorTotal / plazo;
  let totalAssigned = 0;

  return segments.map((segment, index) => {
    const diasPagables = getPayableDays(
      segment.periodoInicio,
      segment.periodoFin,
      index === 0,
      index === segments.length - 1
    );
    let valor = Math.round((monthlyValue * diasPagables) / 30);
    if (index === segments.length - 1) {
      valor = valorTotal - totalAssigned;
    }
    totalAssigned += valor;

    return {
      numero: index + 1,
      periodoInicio: segment.periodoInicio,
      periodoFin: segment.periodoFin,
      diasPagables,
      valor,
    };
  });
}
