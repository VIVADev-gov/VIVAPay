import "server-only";

import { sendEmail } from "@/lib/email/send";
import logger from "@/lib/logger";
import type { CuentaCobroStatus } from "@/models/cuentaCobro";
import {
  resolveWorkflowNotificationRecipient,
  type WorkflowNotificationContractor,
} from "./resolveWorkflowNotificationRecipient";

export type SendWorkflowNotificationEmailInput = {
  contractId: string;
  accountNumber: number;
  contractNumber: string;
  estadoNuevo: CuentaCobroStatus;
  contractor: WorkflowNotificationContractor;
  mensaje?: string;
};

export async function sendWorkflowNotificationEmail(
  input: SendWorkflowNotificationEmailInput
): Promise<void> {
  const recipient = await resolveWorkflowNotificationRecipient({
    estadoNuevo: input.estadoNuevo,
    contractor: input.contractor,
    contractId: input.contractId,
    accountNumber: input.accountNumber,
    mensaje: input.mensaje,
  });

  if (!recipient) {
    return;
  }

  const subject =
    `Cuenta de cobro ${input.accountNumber} — ${recipient.estadoLabel}`.slice(
      0,
      200
    );

  const result = await sendEmail({
    to: recipient.emails,
    subject,
    template: "cuenta-cobro-accion-pendiente",
    data: {
      nombre: recipient.recipientName,
      mensaje: recipient.mensaje,
      estado: recipient.estadoLabel,
      accountNumber: input.accountNumber,
      contractNumber: input.contractNumber,
      contractorName: input.contractor.name,
      url: recipient.actionUrl,
      observaciones: recipient.observaciones ?? "",
    },
  });

  if (!result.success) {
    logger.warn(
      `[cuentas-cobro/workflow] No se pudo enviar notificación: ${result.error ?? "error desconocido"}`
    );
  }
}
