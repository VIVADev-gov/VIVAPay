import { ORGANIZACION_TIPO } from "@/constants/organizacionViva";
import { USER_ROLES, type UserRole } from "@/constants/userRoles";
import { isDevPaymentAccountWindowSkipped } from "@/lib/cuentas-cobro/devPaymentAccountWindow";
import type { CuentaCobroStatus } from "@/types/contratos";

export type WorkflowContractor = {
  organizationalUnitId: string;
  organizationalUnitType: string;
  subareaId?: string | null;
};

export type WorkflowReviewer = WorkflowContractor & {
  role: UserRole;
  id: string;
  signaturePath?: string | null;
};

export type WorkflowAccount = {
  estado: CuentaCobroStatus;
  directorFirmadoAt?: string | Date | null;
};

export function hasWorkflowSignature(user: { signaturePath?: string | null }) {
  return Boolean(user.signaturePath?.trim());
}

export function contractorMatchesReviewer(
  contractor: WorkflowContractor,
  reviewer: WorkflowReviewer
) {
  if (reviewer.role === USER_ROLES.JEFE) {
    return (
      contractor.organizationalUnitId === reviewer.organizationalUnitId &&
      contractor.organizationalUnitType === ORGANIZACION_TIPO.JEFATURA
    );
  }

  if (
    reviewer.role === USER_ROLES.SUPERVISOR ||
    reviewer.role === USER_ROLES.DIRECTOR
  ) {
    return (
      contractor.organizationalUnitId === reviewer.organizationalUnitId &&
      contractor.organizationalUnitType === ORGANIZACION_TIPO.DIRECCION &&
      (contractor.subareaId ?? null) === (reviewer.subareaId ?? null)
    );
  }

  return false;
}

/** Tras envío del contratista: salta director si ya firmó previamente. */
export function resolveStateAfterContractorSubmit(
  contractor: WorkflowContractor,
  account: WorkflowAccount
): CuentaCobroStatus {
  if (contractor.organizationalUnitType === ORGANIZACION_TIPO.JEFATURA) {
    return "PENDIENTE_JEFE";
  }

  if (account.directorFirmadoAt) {
    return "PENDIENTE_ENVIO_CAD";
  }

  return "PENDIENTE_SUPERVISOR";
}

export function canContractorSubmit(account: WorkflowAccount) {
  if (account.estado === "HABILITADA" || account.estado === "PENDIENTE_CONTRATISTA") {
    return true;
  }

  return isDevPaymentAccountWindowSkipped() && account.estado === "PENDIENTE";
}

export function canSupervisorForwardDirector(account: WorkflowAccount) {
  return account.estado === "PENDIENTE_SUPERVISOR" && !account.directorFirmadoAt;
}

export function canSupervisorSendCad(account: WorkflowAccount) {
  return account.estado === "PENDIENTE_ENVIO_CAD" && Boolean(account.directorFirmadoAt);
}

export function canDirectorSign(account: WorkflowAccount) {
  return account.estado === "PENDIENTE_DIRECTOR";
}

export function canJefeApproveSend(account: WorkflowAccount) {
  return account.estado === "PENDIENTE_JEFE";
}

export function canMarkPaid(account: WorkflowAccount) {
  return account.estado === "ENVIADA_CAD";
}

export function canReturnToContractor(
  account: WorkflowAccount,
  role: UserRole
) {
  if (role === USER_ROLES.SUPERVISOR) {
    return (
      account.estado === "PENDIENTE_SUPERVISOR" ||
      account.estado === "PENDIENTE_ENVIO_CAD"
    );
  }
  if (role === USER_ROLES.JEFE) {
    return account.estado === "PENDIENTE_JEFE";
  }
  return false;
}
