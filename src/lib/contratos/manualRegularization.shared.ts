import type { CuentaCobroStatus, PublicCuentaCobro } from "@/types/contratos";

const SUBMITTED_STATUSES = new Set<CuentaCobroStatus>([
  "ENVIADA",
  "ENVIADA_CAD",
  "APROBADA",
  "RECHAZADA",
  "PENDIENTE_SUPERVISOR",
  "PENDIENTE_DIRECTOR",
  "PENDIENTE_ENVIO_CAD",
  "PENDIENTE_JEFE",
  "ENVIADA_CONTRATISTA",
]);

export type ManualRegularizationAccount = Pick<
  PublicCuentaCobro,
  "numero" | "envioManual" | "estado"
>;

export type ManualRegularizationAccountDisplay = Pick<
  PublicCuentaCobro,
  "id" | "numero" | "envioManual" | "estado" | "periodoInicio" | "periodoFin" | "valor"
>;

export function isAppSubmittedAccount(account: ManualRegularizationAccount) {
  return !account.envioManual && SUBMITTED_STATUSES.has(account.estado);
}

export function getManualRegularizationBoundary(
  accounts: ManualRegularizationAccount[]
) {
  const sorted = [...accounts].sort((a, b) => a.numero - b.numero);
  const firstAppSubmitted = sorted.find(isAppSubmittedAccount);
  if (!firstAppSubmitted) {
    return sorted.length;
  }
  return firstAppSubmitted.numero - 1;
}

export function countManualPaymentAccounts(
  accounts: Pick<PublicCuentaCobro, "envioManual">[]
) {
  return accounts.filter((account) => account.envioManual).length;
}

export function canToggleManualRegularizationAccount(
  account: ManualRegularizationAccount,
  boundary: number
) {
  if (isAppSubmittedAccount(account)) {
    return false;
  }
  return account.numero <= boundary;
}
