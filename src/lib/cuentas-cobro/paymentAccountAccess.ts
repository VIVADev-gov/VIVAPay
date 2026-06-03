import type { CuentaCobroStatus, PublicCuentaCobro } from "@/types/contratos";
import { parseDateOnlyToUtcNoon } from "@/utils/date";

const MANAGEABLE_STATUSES = new Set<CuentaCobroStatus>([
  "BORRADOR",
  "PENDIENTE",
  "HABILITADA",
]);

const READ_ONLY_STATUSES = new Set<CuentaCobroStatus>([
  "ENVIADA",
  "APROBADA",
  "RECHAZADA",
]);

export function getPaymentAccountHref(contractId: string, numero: number) {
  return `/dashboard/contrato/${contractId}/cuentas-cobro/${numero}`;
}

export function canViewPaymentAccount(account: PublicCuentaCobro) {
  return Boolean(account.numero);
}

export function canManagePaymentAccount(account: PublicCuentaCobro) {
  return MANAGEABLE_STATUSES.has(account.estado);
}

export function isPaymentAccountReadOnly(account: PublicCuentaCobro) {
  return READ_ONLY_STATUSES.has(account.estado);
}

export function isPaymentAccountSubmissionWindowOpen(
  account: PublicCuentaCobro,
  today: Date = new Date()
) {
  const from = parseDateOnlyToUtcNoon(account.fechaHabilitadaEnvio);
  const to = parseDateOnlyToUtcNoon(account.fechaLimiteEnvio);

  if (from && today < from) return false;
  if (to && today > to) return false;
  return true;
}

export function canSubmitPaymentAccount(
  account: PublicCuentaCobro,
  today: Date = new Date()
) {
  return (
    account.estado === "HABILITADA" &&
    isPaymentAccountSubmissionWindowOpen(account, today)
  );
}

export function getPaymentAccountActionLabel(account: PublicCuentaCobro) {
  if (isPaymentAccountReadOnly(account)) return "Ver cuenta";
  if (canSubmitPaymentAccount(account)) return "Gestionar envío";
  if (canManagePaymentAccount(account)) return "Ver detalle";
  return "Ver cuenta";
}
