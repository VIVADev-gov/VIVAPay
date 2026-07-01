import { Types } from "mongoose";
import {
  CUENTA_COBRO_STATUS,
  CuentaCobro,
  type ICuentaCobro,
} from "@/models/cuentaCobro";
import { parseDateOnlyToUtcNoon } from "@/utils/date";
import { resolveInitialStatus } from "@/lib/contratos/paymentAccountInitialStatus";
import { getPayableDays } from "@/lib/cuentas-cobro/paymentAccountPreview";

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

/**
 * Genera cuentas de cobro por cada mes calendario tocado. El valor se reparte
 * proporcional a los días pagables reales de cada mes (mes contable de 30 días),
 * de modo que los meses completos valen `valorTotal × 30 / totalDías` y el primer
 * y último mes parciales cobran solo su fracción. La última cuenta toma el
 * remanente exacto para consumir el valor total sin inflarse.
 */
export async function generatePaymentAccountsForContract(
  input: GeneratePaymentAccountsInput
) {
  const { userId, contratoId, fechaActaInicio, fechaFinal, valorTotal } = input;

  const segments = buildPaymentSegments(fechaActaInicio, fechaFinal);
  if (segments.length === 0) return [];

  const totalDias = segments.reduce(
    (sum, segment) => sum + segment.diasPagables,
    0
  );
  const today = new Date();

  const accounts: Omit<ICuentaCobro, "createdAt" | "updatedAt">[] = [];
  let totalAssigned = 0;

  for (let i = 0; i < segments.length; i++) {
    const { periodoInicio, periodoFin, diasPagables } = segments[i];

    // Reparto proporcional a los días pagables reales. La última cuenta toma el
    // remanente exacto para cuadrar con el valor total sin inflarse (el remanente
    // equivale a su parte proporcional salvo centavos de redondeo).
    let valor: number;
    if (i === segments.length - 1) {
      valor = valorTotal - totalAssigned;
    } else {
      valor =
        totalDias > 0 ? Math.round((valorTotal * diasPagables) / totalDias) : 0;
      totalAssigned += valor;
    }

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
