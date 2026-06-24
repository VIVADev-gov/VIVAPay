import type { CuentaCobroStatus } from "@/types/contratos";
import type { FormPaymentAccountSnapshot } from "../types";

const GFR_FO_17_HISTORIAL_STATUSES = new Set<CuentaCobroStatus>([
  "APROBADA",
  "ENVIADA",
  "ENVIADA_CAD",
  "PENDIENTE_SUPERVISOR",
  "PENDIENTE_DIRECTOR",
  "PENDIENTE_ENVIO_CAD",
  "PENDIENTE_JEFE",
  "ENVIADA_CONTRATISTA",
]);

export function isGfrFo17HistorialEligible(
  account: Pick<FormPaymentAccountSnapshot, "estado" | "numero">,
  currentNumero: number
) {
  return (
    account.numero <= currentNumero &&
    GFR_FO_17_HISTORIAL_STATUSES.has(account.estado)
  );
}

export function getGfrFo17HistorialAccounts(
  accounts: FormPaymentAccountSnapshot[],
  currentNumero: number
) {
  return accounts
    .filter((account) => isGfrFo17HistorialEligible(account, currentNumero))
    .sort((a, b) => a.numero - b.numero);
}
