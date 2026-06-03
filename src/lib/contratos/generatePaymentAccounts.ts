import { Types } from "mongoose";
import {
  CUENTA_COBRO_STATUS,
  CuentaCobro,
  type ICuentaCobro,
} from "@/models/cuentaCobro";

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export type GeneratePaymentAccountsInput = {
  userId: Types.ObjectId;
  contratoId: Types.ObjectId;
  fechaActaInicio: Date;
  fechaFinal: Date;
  plazoMeses: number;
  valorTotal: number;
};

/**
 * Genera cuentas de cobro mensuales básicas vinculadas al contrato.
 * La lógica fina de prorrateo por días se ajustará en iteraciones posteriores.
 */
export async function generatePaymentAccountsForContract(
  input: GeneratePaymentAccountsInput
) {
  const { userId, contratoId, fechaActaInicio, fechaFinal, plazoMeses, valorTotal } =
    input;

  const months = Math.max(1, Math.round(plazoMeses));
  const baseMonthlyValue = Math.round(valorTotal / months);
  const remainder = valorTotal - baseMonthlyValue * months;

  const accounts: Omit<ICuentaCobro, "createdAt" | "updatedAt">[] = [];
  const today = new Date();

  for (let i = 0; i < months; i++) {
    const periodoInicio =
      i === 0 ? new Date(fechaActaInicio) : startOfMonth(addMonths(fechaActaInicio, i));

    const periodoFin =
      i === months - 1
        ? new Date(fechaFinal)
        : endOfMonth(periodoInicio);

    const fechaHabilitadaEnvio = new Date(periodoInicio);
    const fechaLimiteEnvio = endOfMonth(periodoFin);

    const valor =
      i === months - 1 ? baseMonthlyValue + remainder : baseMonthlyValue;

    const isPastPeriod = fechaLimiteEnvio < today && i < months - 1;
    const isCurrentOrFuture = fechaHabilitadaEnvio <= today || periodoFin >= today;

    let estado = CUENTA_COBRO_STATUS.PENDIENTE;
    if (isPastPeriod) {
      estado = CUENTA_COBRO_STATUS.PENDIENTE;
    } else if (fechaHabilitadaEnvio <= today && fechaLimiteEnvio >= today) {
      estado = CUENTA_COBRO_STATUS.HABILITADA;
    } else if (!isCurrentOrFuture) {
      estado = CUENTA_COBRO_STATUS.PENDIENTE;
    }

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
      observaciones: `Cuenta de cobro ${i + 1} de ${months}`,
    });
  }

  if (accounts.length === 0) return [];

  return CuentaCobro.insertMany(accounts);
}
