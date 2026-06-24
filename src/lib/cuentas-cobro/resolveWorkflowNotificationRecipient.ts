import "server-only";

import { CUENTA_COBRO_STATUS_LABELS } from "@/constants/cuentaCobroWorkflow";
import { USER_ROLES, type UserRole } from "@/constants/userRoles";
import { getDashboardPathForRole } from "@/lib/auth/roles";
import { connectDB } from "@/lib/db/mongoose";
import { getEmailCad } from "@/lib/email/getEmailCad";
import logger from "@/lib/logger";
import type { CuentaCobroStatus } from "@/models/cuentaCobro";
import {
  getPaymentAccountHref,
  getPaymentAccountReviewHref,
} from "./paymentAccountAccess";
import { findReviewerEmail } from "./findReviewerByOrg";

export type WorkflowNotificationContractor = {
  name: string;
  email: string;
  organizationalUnitId: string;
  organizationalUnitType: string;
  subareaId?: string | null;
};

export type WorkflowNotificationRecipient = {
  emails: string[];
  recipientName: string;
  roleLabel: string;
  actionUrl: string;
  mensaje: string;
  estadoLabel: string;
  observaciones?: string;
};

const NOTIFIABLE_STATUSES = new Set<CuentaCobroStatus>([
  "PENDIENTE_SUPERVISOR",
  "PENDIENTE_JEFE",
  "PENDIENTE_DIRECTOR",
  "PENDIENTE_ENVIO_CAD",
  "PENDIENTE_CONTRATISTA",
  "ENVIADA_CAD",
]);

function getAppHost() {
  return process.env.NEXT_PUBLIC_HOST?.trim() || "http://localhost:3000";
}

function buildActionUrl(role: UserRole, contractId: string, accountNumber: number) {
  const host = getAppHost();
  const path =
    role === USER_ROLES.CONTRATISTA
      ? getPaymentAccountHref(contractId, accountNumber)
      : getPaymentAccountReviewHref(
          getDashboardPathForRole(role),
          contractId,
          accountNumber
        );
  return `${host.replace(/\/$/, "")}${path}`;
}

function buildMensaje(
  estadoNuevo: CuentaCobroStatus,
  contractorName: string,
  accountNumber: number
) {
  switch (estadoNuevo) {
    case "PENDIENTE_SUPERVISOR":
      return `La cuenta de cobro No. ${accountNumber} de ${contractorName} fue enviada y está pendiente de tu revisión.`;
    case "PENDIENTE_JEFE":
      return `La cuenta de cobro No. ${accountNumber} de ${contractorName} está pendiente de tu aprobación y envío al CAD.`;
    case "PENDIENTE_DIRECTOR":
      return `La cuenta de cobro No. ${accountNumber} de ${contractorName} está pendiente de tu firma.`;
    case "PENDIENTE_ENVIO_CAD":
      return `La cuenta de cobro No. ${accountNumber} de ${contractorName} ya tiene firma del director y está lista para enviarse al CAD.`;
    case "PENDIENTE_CONTRATISTA":
      return `Tu cuenta de cobro No. ${accountNumber} fue devuelta. Debes corregirla y reenviarla.`;
    case "ENVIADA_CAD":
      return `La cuenta de cobro No. ${accountNumber} de ${contractorName} fue enviada al CAD.`;
    default:
      return `La cuenta de cobro No. ${accountNumber} de ${contractorName} requiere tu atención.`;
  }
}

export async function resolveWorkflowNotificationRecipient(input: {
  estadoNuevo: CuentaCobroStatus;
  contractor: WorkflowNotificationContractor;
  contractId: string;
  accountNumber: number;
  mensaje?: string;
}): Promise<WorkflowNotificationRecipient | null> {
  if (!NOTIFIABLE_STATUSES.has(input.estadoNuevo)) {
    return null;
  }

  const estadoLabel = CUENTA_COBRO_STATUS_LABELS[input.estadoNuevo];
  const mensajeBase = buildMensaje(
    input.estadoNuevo,
    input.contractor.name,
    input.accountNumber
  );

  if (input.estadoNuevo === "PENDIENTE_CONTRATISTA") {
    const email = input.contractor.email?.trim();
    if (!email) {
      logger.warn("[cuentas-cobro/workflow] Contratista sin email para notificación");
      return null;
    }

    return {
      emails: [email],
      recipientName: input.contractor.name,
      roleLabel: "Contratista",
      actionUrl: buildActionUrl(
        USER_ROLES.CONTRATISTA,
        input.contractId,
        input.accountNumber
      ),
      mensaje: mensajeBase,
      estadoLabel,
      observaciones: input.mensaje?.trim() || undefined,
    };
  }

  if (input.estadoNuevo === "ENVIADA_CAD") {
    const email = getEmailCad();
    if (!email) {
      logger.warn("[cuentas-cobro/workflow] EMAIL_CAD no configurado");
      return null;
    }

    return {
      emails: [email],
      recipientName: "CAD",
      roleLabel: "CAD",
      actionUrl: buildActionUrl(
        USER_ROLES.SUPERVISOR,
        input.contractId,
        input.accountNumber
      ),
      mensaje: mensajeBase,
      estadoLabel,
    };
  }

  await connectDB();

  const targetRole =
    input.estadoNuevo === "PENDIENTE_JEFE"
      ? USER_ROLES.JEFE
      : input.estadoNuevo === "PENDIENTE_DIRECTOR"
        ? USER_ROLES.DIRECTOR
        : USER_ROLES.SUPERVISOR;

  const reviewer = await findReviewerEmail(targetRole, input.contractor);
  if (!reviewer) {
    logger.warn(
      `[cuentas-cobro/workflow] No se encontró ${targetRole} activo para notificación`
    );
    return null;
  }

  const roleLabels: Record<UserRole, string> = {
    [USER_ROLES.SUPERVISOR]: "Supervisor",
    [USER_ROLES.JEFE]: "Jefe",
    [USER_ROLES.DIRECTOR]: "Director",
    [USER_ROLES.CONTRATISTA]: "Contratista",
  };

  return {
    emails: [reviewer.email],
    recipientName: reviewer.name,
    roleLabel: roleLabels[targetRole],
    actionUrl: buildActionUrl(targetRole, input.contractId, input.accountNumber),
    mensaje: mensajeBase,
    estadoLabel,
  };
}
