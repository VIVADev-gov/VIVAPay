import {
  getTotalContractPayableDays,
  mapPayableDaysByAccountNumero,
} from "@/lib/cuentas-cobro/paymentAccountPreview";

export type GfrFo17EjecucionAccount = {
  numero: number;
  periodoInicio: Date | null;
  periodoFin: Date | null;
};

export function computeGfrFo17EjecucionPorcentajes(ctx: {
  paymentAccounts: readonly GfrFo17EjecucionAccount[];
  paymentAccount: GfrFo17EjecucionAccount;
}) {
  const { paymentAccounts, paymentAccount } = ctx;
  const currentNumero = paymentAccount.numero;
  const payableDaysByNumero = mapPayableDaysByAccountNumero(paymentAccounts);
  const totalDiasContrato = getTotalContractPayableDays(paymentAccounts);

  const accountsHastaActual = paymentAccounts.filter(
    (account) => account.numero <= currentNumero
  );

  const diasEjecutados = accountsHastaActual.reduce(
    (sum, account) => sum + (payableDaysByNumero.get(account.numero) ?? 0),
    0
  );

  const fisica =
    totalDiasContrato > 0 ? diasEjecutados / totalDiasContrato : 0;

  return {
    financiera: fisica,
    fisica,
  };
}
