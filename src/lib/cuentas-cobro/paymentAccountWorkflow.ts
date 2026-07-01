import {
  ORGANIZACION_TIPO,
  subareaHasSupervisor,
} from "@/constants/organizacionViva";
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

export function contractorQueryFilterForReviewer(reviewer: WorkflowReviewer) {
  const base = {
    organizationalUnitId: reviewer.organizationalUnitId,
  };

  if (reviewer.role === USER_ROLES.JEFE) {
    return {
      ...base,
      organizationalUnitType: ORGANIZACION_TIPO.JEFATURA,
    };
  }

  if (reviewer.role === USER_ROLES.DIRECTOR) {
    return {
      ...base,
      organizationalUnitType: ORGANIZACION_TIPO.DIRECCION,
    };
  }

  return {
    ...base,
    organizationalUnitType: ORGANIZACION_TIPO.DIRECCION,
    subareaId: reviewer.subareaId ?? null,
  };
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

  if (reviewer.role === USER_ROLES.DIRECTOR) {
    if (
      contractor.organizationalUnitId !== reviewer.organizationalUnitId ||
      contractor.organizationalUnitType !== ORGANIZACION_TIPO.DIRECCION
    ) {
      return false;
    }
    if (!reviewer.subareaId) {
      return true;
    }
    return (contractor.subareaId ?? null) === reviewer.subareaId;
  }

  if (reviewer.role === USER_ROLES.SUPERVISOR) {
    return (
      contractor.organizationalUnitId === reviewer.organizationalUnitId &&
      contractor.organizationalUnitType === ORGANIZACION_TIPO.DIRECCION &&
      (contractor.subareaId ?? null) === (reviewer.subareaId ?? null)
    );
  }

  return false;
}

/** Tras envío del contratista: jefatura → jefe; dirección sin supervisor → director; con supervisor → supervisor o CAD si ya firmó. */
export function resolveStateAfterContractorSubmit(
  contractor: WorkflowContractor,
  account: WorkflowAccount
): CuentaCobroStatus {
  if (contractor.organizationalUnitType === ORGANIZACION_TIPO.JEFATURA) {
    return "PENDIENTE_JEFE";
  }

  const hasSupervisor = subareaHasSupervisor(
    contractor.organizationalUnitId,
    contractor.subareaId
  );

  if (!hasSupervisor) {
    return "PENDIENTE_DIRECTOR";
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

export function canSupervisorForwardDirector(
  account: WorkflowAccount,
  contractor: WorkflowContractor
) {
  return (
    subareaHasSupervisor(
      contractor.organizationalUnitId,
      contractor.subareaId
    ) &&
    account.estado === "PENDIENTE_SUPERVISOR" &&
    !account.directorFirmadoAt
  );
}

export function canSupervisorSendCad(
  account: WorkflowAccount,
  contractor: WorkflowContractor
) {
  return (
    subareaHasSupervisor(
      contractor.organizationalUnitId,
      contractor.subareaId
    ) &&
    account.estado === "PENDIENTE_ENVIO_CAD" &&
    Boolean(account.directorFirmadoAt)
  );
}

export function canDirectorSign(
  account: WorkflowAccount,
  contractor: WorkflowContractor
) {
  return (
    account.estado === "PENDIENTE_DIRECTOR" &&
    subareaHasSupervisor(
      contractor.organizationalUnitId,
      contractor.subareaId
    )
  );
}

export function canDirectorApproveSend(
  account: WorkflowAccount,
  contractor: WorkflowContractor
) {
  return (
    account.estado === "PENDIENTE_DIRECTOR" &&
    !subareaHasSupervisor(
      contractor.organizationalUnitId,
      contractor.subareaId
    )
  );
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
  if (role === USER_ROLES.DIRECTOR) {
    return account.estado === "PENDIENTE_DIRECTOR";
  }
  return false;
}

/** Cuentas que no deben aparecer en la bandeja del supervisor (flujo directo al director). */
export function shouldHideFromSupervisorInbox(
  contractor: WorkflowContractor,
  estado: CuentaCobroStatus
) {
  if (
    subareaHasSupervisor(
      contractor.organizationalUnitId,
      contractor.subareaId
    )
  ) {
    return false;
  }
  return (
    estado === "PENDIENTE_SUPERVISOR" || estado === "PENDIENTE_ENVIO_CAD"
  );
}
