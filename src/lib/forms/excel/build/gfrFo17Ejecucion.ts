import {
  getTotalContractPayableDays,
  mapPayableDaysByAccountNumero,
} from "@/lib/cuentas-cobro/paymentAccountPreview";
import type { FormPackageContext } from "../types";

export function computeGfrFo17EjecucionPorcentajes(
  ctx: Pick<FormPackageContext, "paymentAccounts" | "paymentAccount">
) {
  const { paymentAccounts, paymentAccount } = ctx;
  const currentNumero = paymentAccount.numero;
  const payableDaysByNumero = mapPayableDaysByAccountNumero(paymentAccounts);
  const totalDiasContrato = getTotalContractPayableDays(paymentAccounts);

  const accountsHastaActual = paymentAccounts.filter(
    (account) => account.numero <= currentNumero
  );

  const valorAcumulado = accountsHastaActual.reduce(
    (sum, account) => sum + (account.valor ?? 0),
    0
  );

  const valorTotalCuentas = paymentAccounts.reduce(
    (sum, account) => sum + (account.valor ?? 0),
    0
  );

  const diasEjecutados = accountsHastaActual.reduce(
    (sum, account) => sum + (payableDaysByNumero.get(account.numero) ?? 0),
    0
  );

  return {
    financiera:
      valorTotalCuentas > 0 ? valorAcumulado / valorTotalCuentas : 0,
    fisica: totalDiasContrato > 0 ? diasEjecutados / totalDiasContrato : 0,
  };
}
