import {
  getTotalContractPayableDays,
  mapPayableDaysByAccountNumero,
} from "@/lib/cuentas-cobro/paymentAccountPreview";
import type { FormPackageContext } from "../types";

export function computeGfrFo17EjecucionPorcentajes(
  ctx: Pick<FormPackageContext, "contract" | "paymentAccounts" | "paymentAccount">
) {
  const { contract, paymentAccounts, paymentAccount } = ctx;
  const valorContrato = contract.valorInicialContrato;
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

  const diasEjecutados = accountsHastaActual.reduce(
    (sum, account) => sum + (payableDaysByNumero.get(account.numero) ?? 0),
    0
  );

  return {
    financiera: valorContrato > 0 ? valorAcumulado / valorContrato : 0,
    fisica: totalDiasContrato > 0 ? diasEjecutados / totalDiasContrato : 0,
  };
}
