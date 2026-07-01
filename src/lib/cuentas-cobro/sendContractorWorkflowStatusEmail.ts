import "server-only";

import { sendEmail } from "@/lib/email/send";
import logger from "@/lib/logger";
import type { CuentaCobroStatus } from "@/models/cuentaCobro";
import {
  resolveContractorWorkflowStatusContent,
  type ContractorWorkflowStatusContent,
} from "./resolveContractorWorkflowStatus";
import type { WorkflowNotificationContractor } from "./resolveWorkflowNotificationRecipient";

export type SendContractorWorkflowStatusEmailInput = {
  contractId: string;
  accountNumber: number;
  contractNumber: string;
  estadoNuevo: CuentaCobroStatus;
  contractor: WorkflowNotificationContractor;
  observaciones?: string;
  contentOverride?: ContractorWorkflowStatusContent;
};

export async function sendContractorWorkflowStatusEmail(
  input: SendContractorWorkflowStatusEmailInput
): Promise<void> {
  const email = input.contractor.email?.trim();
  if (!email) {
    logger.warn(
      "[cuentas-cobro/workflow] Contratista sin email para notificación de estado"
    );
    return;
  }

  const content =
    input.contentOverride ??
    resolveContractorWorkflowStatusContent({
      estadoNuevo: input.estadoNuevo,
      contractId: input.contractId,
      accountNumber: input.accountNumber,
      contractor: input.contractor,
    });

  if (!content) return;

  const subject =
    `Tu cuenta de cobro ${input.accountNumber} — ${content.estadoLabel}`.slice(
      0,
      200
    );

  const result = await sendEmail({
    to: email,
    subject,
    template: "cuenta-cobro-estado-contratista",
    data: {
      nombre: input.contractor.name,
      mensaje: content.mensaje,
      estado: content.estadoLabel,
      accountNumber: input.accountNumber,
      contractNumber: input.contractNumber,
      url: content.actionUrl,
      observaciones: input.observaciones?.trim() ?? "",
    },
  });

  if (!result.success) {
    logger.warn(
      `[cuentas-cobro/workflow] No se pudo notificar al contratista: ${result.error ?? "error desconocido"}`
    );
  }
}
