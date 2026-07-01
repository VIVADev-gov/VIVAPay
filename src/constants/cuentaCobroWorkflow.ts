import type { UserRole } from "@/constants/userRoles";
import { USER_ROLES } from "@/constants/userRoles";
import type { CuentaCobroStatus } from "@/types/contratos";

export const CUENTA_COBRO_WORKFLOW_ACTION = {
  SUBMIT: "submit",
  FORWARD_DIRECTOR: "forward_director",
  RETURN: "return",
  DIRECTOR_SIGN: "director_sign",
  SEND_CAD: "send_cad",
  JEFE_APPROVE_SEND: "jefe_approve_send",
  DIRECTOR_APPROVE_SEND: "director_approve_send",
  MARK_PAID: "mark_paid",
} as const;

export type CuentaCobroWorkflowAction =
  (typeof CUENTA_COBRO_WORKFLOW_ACTION)[keyof typeof CUENTA_COBRO_WORKFLOW_ACTION];

export const CONTRACTOR_EDITABLE_STATUSES: CuentaCobroStatus[] = [
  "BORRADOR",
  "PENDIENTE",
  "HABILITADA",
  "PENDIENTE_CONTRATISTA",
];

export const IN_REVIEW_STATUSES: CuentaCobroStatus[] = [
  "ENVIADA_CONTRATISTA",
  "PENDIENTE_SUPERVISOR",
  "PENDIENTE_DIRECTOR",
  "PENDIENTE_ENVIO_CAD",
  "PENDIENTE_JEFE",
];

export const COMPLETED_STATUSES: CuentaCobroStatus[] = [
  "ENVIADA",
  "ENVIADA_CAD",
  "APROBADA",
  "RECHAZADA",
];

export const CUENTA_COBRO_STATUS_LABELS: Record<CuentaCobroStatus, string> = {
  BORRADOR: "Borrador",
  PENDIENTE: "Pendiente",
  HABILITADA: "Habilitada",
  PENDIENTE_CONTRATISTA: "Devuelta al contratista",
  ENVIADA_CONTRATISTA: "Enviada",
  PENDIENTE_SUPERVISOR: "Pendiente supervisor",
  PENDIENTE_DIRECTOR: "Pendiente director",
  PENDIENTE_ENVIO_CAD: "Lista para CAD",
  PENDIENTE_JEFE: "Pendiente jefe",
  ENVIADA: "Enviada",
  ENVIADA_CAD: "Enviada al CAD",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
};

export function inboxStatusesForRole(role: UserRole): CuentaCobroStatus[] {
  switch (role) {
    case USER_ROLES.SUPERVISOR:
      return ["PENDIENTE_SUPERVISOR", "PENDIENTE_ENVIO_CAD"];
    case USER_ROLES.DIRECTOR:
      return ["PENDIENTE_DIRECTOR"];
    case USER_ROLES.JEFE:
      return ["PENDIENTE_JEFE"];
    default:
      return [];
  }
}

export function isDirectorSigned(
  account: { directorFirmadoAt?: string | null } | null | undefined
) {
  return Boolean(account?.directorFirmadoAt);
}
