import type { CuentaCobroStatus, PublicCuentaCobro } from "@/types/contratos";
import { CONTRACTOR_EDITABLE_STATUSES } from "@/constants/cuentaCobroWorkflow";
import { parseDateOnlyToUtcNoon } from "@/utils/date";

const MANAGEABLE_STATUSES = new Set<CuentaCobroStatus>(CONTRACTOR_EDITABLE_STATUSES);

const READ_ONLY_STATUSES = new Set<CuentaCobroStatus>([
  "ENVIADA_CONTRATISTA",
  "PENDIENTE_SUPERVISOR",
  "PENDIENTE_DIRECTOR",
  "PENDIENTE_ENVIO_CAD",
  "PENDIENTE_JEFE",
  "ENVIADA",
  "ENVIADA_CAD",
  "APROBADA",
  "RECHAZADA",
]);

const CONTRATISTA_CONTRACT_BASE = "/dashboard/contratista/contrato";

export function getContractDetailHref(contractId: string) {
  return `${CONTRATISTA_CONTRACT_BASE}/${contractId}`;
}

export function getPaymentAccountHref(contractId: string, numero: number) {
  return `${CONTRATISTA_CONTRACT_BASE}/${contractId}/cuentas-cobro/${numero}`;
}

export function getPaymentAccountReviewHref(
  roleBase: string,
  contractId: string,
  numero: number
) {
  return `${roleBase}/cuentas-cobro/${contractId}/${numero}`;
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
    (account.estado === "HABILITADA" ||
      account.estado === "PENDIENTE_CONTRATISTA") &&
    isPaymentAccountSubmissionWindowOpen(account, today)
  );
}

export function getPaymentAccountActionLabel(account: PublicCuentaCobro) {
  if (account.estado === "PENDIENTE_CONTRATISTA") return "Corregir y reenviar";
  if (isPaymentAccountReadOnly(account)) return "Ver cuenta";
  if (canSubmitPaymentAccount(account)) return "Gestionar envío";
  if (canManagePaymentAccount(account)) return "Ver detalle";
  return "Ver cuenta";
}
