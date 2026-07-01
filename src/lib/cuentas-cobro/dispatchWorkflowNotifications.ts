import "server-only";

import {
  PAYMENT_ACCOUNT_ERROR_CODES,
  PaymentAccountServiceError,
} from "@/app/api/cuentas-cobro/cuentas-cobro.errors";
import { getEmailCad } from "@/lib/email/getEmailCad";
import logger from "@/lib/logger";
import type { CuentaCobroStatus } from "@/models/cuentaCobro";
import { sendCadPackageEmail } from "./sendCadPackageEmail";
import { sendContractorWorkflowStatusEmail } from "./sendContractorWorkflowStatusEmail";
import { sendWorkflowNotificationEmail } from "./sendWorkflowNotificationEmail";

type WorkflowContractorSnapshot = {
  name: string;
  email: string;
  organizationalUnitId: string;
  organizationalUnitType: string;
  subareaId?: string | null;
};

export function assertCadEmailConfigured() {
  if (!getEmailCad()) {
    throw new PaymentAccountServiceError(
      "EMAIL_CAD no está configurado en el servidor. No se puede enviar al CAD.",
      503,
      PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_INVALID_STATE
    );
  }
}

export async function dispatchWorkflowNotifications(input: {
  contractId: string;
  accountNumber: number;
  contractNumber: string;
  accountEstado: CuentaCobroStatus;
  estadoParaNotificacion?: CuentaCobroStatus | null;
  contractor: WorkflowContractorSnapshot;
  userId: string;
  mensaje?: string;
}) {
  const estadoNotificacion = input.estadoParaNotificacion ?? input.accountEstado;
  const isCadDelivery =
    estadoNotificacion === "ENVIADA_CAD" || input.accountEstado === "ENVIADA_CAD";

  const contractorPayload = {
    name: input.contractor.name,
    email: input.contractor.email,
    organizationalUnitId: input.contractor.organizationalUnitId,
    organizationalUnitType: input.contractor.organizationalUnitType,
    subareaId: input.contractor.subareaId,
  };

  if (!isCadDelivery) {
    try {
      await sendWorkflowNotificationEmail({
        contractId: input.contractId,
        accountNumber: input.accountNumber,
        contractNumber: input.contractNumber,
        estadoNuevo: estadoNotificacion,
        contractor: contractorPayload,
        mensaje: input.mensaje,
      });
    } catch (error) {
      logger.error("[cuentas-cobro/workflow] notificación revisor", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (estadoNotificacion !== "PENDIENTE_CONTRATISTA") {
    try {
      await sendContractorWorkflowStatusEmail({
        contractId: input.contractId,
        accountNumber: input.accountNumber,
        contractNumber: input.contractNumber,
        estadoNuevo: estadoNotificacion,
        contractor: contractorPayload,
      });
    } catch (error) {
      logger.error("[cuentas-cobro/workflow] notificación contratista", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (!isCadDelivery) {
    return;
  }

  const cadResult = await sendCadPackageEmail({
    userId: input.userId,
    contractId: input.contractId,
    accountNumber: input.accountNumber,
  });

  if (!cadResult.success) {
    throw new PaymentAccountServiceError(
      cadResult.error ?? "No se pudo enviar el paquete al CAD",
      502,
      PAYMENT_ACCOUNT_ERROR_CODES.WORKFLOW_INVALID_STATE
    );
  }

  logger.info("[cuentas-cobro/workflow] Paquete CAD enviado", {
    contractId: input.contractId,
    accountNumber: input.accountNumber,
    attachmentCount: cadResult.attachmentCount,
    messageId: cadResult.messageId,
  });
}
