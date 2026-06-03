import { Types } from "mongoose";
import {
  CUENTA_COBRO_STATUS,
  CuentaCobro,
  type ICuentaCobro,
} from "@/models/cuentaCobro";
import { parseDateOnlyToUtcNoon } from "@/utils/date";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DAYS_BEFORE_ENABLE = 5;

export type GeneratePaymentAccountsInput = {
  userId: Types.ObjectId;
  contratoId: Types.ObjectId;
  fechaActaInicio: Date;
  fechaFinal: Date;
  plazoMeses: number;
  valorTotal: number;
};

type PaymentSegment = {
  periodoInicio: Date;
  periodoFin: Date;
  diasPagables: number;
};

function lastDayOfUtcMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0, 12, 0, 0, 0)).getUTCDate();
}

function utcMonthStart(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 1, 12, 0, 0, 0));
}

function utcMonthEnd(year: number, month: number): Date {
  const last = lastDayOfUtcMonth(year, month);
  return new Date(Date.UTC(year, month, last, 12, 0, 0, 0));
}

function calendarDaysInclusive(start: Date, end: Date): number {
  return (
    Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY) + 1
  );
}

function isFullCalendarMonthSegment(start: Date, end: Date): boolean {
  const y = start.getUTCFullYear();
  const m = start.getUTCMonth();
  return (
    start.getUTCDate() === 1 &&
    end.getUTCDate() === lastDayOfUtcMonth(y, m) &&
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

  if (isFullCalendarMonthSegment(periodoInicio, periodoFin)) {
    return 30;
  }

  if (isFirstSegment && periodoInicio.getUTCDate() !== 1) {
    return Math.min(30, periodoFin.getUTCDate() - periodoInicio.getUTCDate());
  }

  if (isLastSegment && periodoFin.getUTCDate() !== lastDayOfUtcMonth(
    periodoFin.getUTCFullYear(),
    periodoFin.getUTCMonth()
  )) {
    return Math.min(30, calendarDays);
  }

  return Math.min(30, calendarDays);
}

function subtractDays(date: Date, days: number): Date {
  return new Date(date.getTime() - days * MS_PER_DAY);
}

function buildPaymentSegments(
  fechaActaInicio: Date,
  fechaFinal: Date
): PaymentSegment[] {
  const start = parseDateOnlyToUtcNoon(fechaActaInicio)!;
  const end = parseDateOnlyToUtcNoon(fechaFinal)!;
  const segments: PaymentSegment[] = [];

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

    const periodoInicio = start > monthStart ? start : monthStart;
    const periodoFin = end < monthEnd ? end : monthEnd;

    segments.push({
      periodoInicio,
      periodoFin,
      diasPagables: 0,
    });

    if (monthEnd >= end) break;

    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  return segments.map((segment, index) => ({
    ...segment,
    diasPagables: getPayableDays(
      segment.periodoInicio,
      segment.periodoFin,
      index === 0,
      index === segments.length - 1
    ),
  }));
}

function resolveInitialStatus(
  fechaHabilitadaEnvio: Date,
  fechaLimiteEnvio: Date,
  today: Date
): (typeof CUENTA_COBRO_STATUS)[keyof typeof CUENTA_COBRO_STATUS] {
  if (fechaHabilitadaEnvio <= today && fechaLimiteEnvio >= today) {
    return CUENTA_COBRO_STATUS.HABILITADA;
  }
  return CUENTA_COBRO_STATUS.PENDIENTE;
}

/**
 * Genera cuentas de cobro por cada mes calendario tocado, con prorrateo
 * (máx. 30 días pagables por mes) y consumo exacto del valor total del contrato.
 */
export async function generatePaymentAccountsForContract(
  input: GeneratePaymentAccountsInput
) {
  const { userId, contratoId, fechaActaInicio, fechaFinal, plazoMeses, valorTotal } =
    input;

  const segments = buildPaymentSegments(fechaActaInicio, fechaFinal);
  if (segments.length === 0) return [];

  const plazo = Math.max(1, Math.round(plazoMeses));
  const valorMensual = valorTotal / plazo;
  const today = new Date();

  const accounts: Omit<ICuentaCobro, "createdAt" | "updatedAt">[] = [];
  let totalAssigned = 0;

  for (let i = 0; i < segments.length; i++) {
    const { periodoInicio, periodoFin, diasPagables } = segments[i];

    let valor = Math.round((valorMensual * diasPagables) / 30);
    if (i === segments.length - 1) {
      valor = valorTotal - totalAssigned;
    }
    totalAssigned += valor;

    const fechaLimiteEnvio = new Date(periodoFin);
    const fechaHabilitadaEnvio = subtractDays(periodoFin, DAYS_BEFORE_ENABLE);
    const estado = resolveInitialStatus(
      fechaHabilitadaEnvio,
      fechaLimiteEnvio,
      today
    );

    accounts.push({
      userId,
      contratoId,
      numero: i + 1,
      periodoInicio,
      periodoFin,
      fechaHabilitadaEnvio,
      fechaLimiteEnvio,
      fechaEnvio: null,
      estado,
      valor,
      observaciones: `Cuenta de cobro ${i + 1} de ${segments.length} (${diasPagables} días pagables)`,
    });
  }

  return CuentaCobro.insertMany(accounts);
}
