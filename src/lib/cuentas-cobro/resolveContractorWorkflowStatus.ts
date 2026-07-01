import "server-only";

import { CUENTA_COBRO_STATUS_LABELS } from "@/constants/cuentaCobroWorkflow";
import { ORGANIZACION_TIPO, subareaHasSupervisor } from "@/constants/organizacionViva";
import { buildAppUrl } from "@/lib/appHost";
import { getPaymentAccountHref } from "@/lib/cuentas-cobro/paymentAccountAccess";
import type { CuentaCobroStatus } from "@/models/cuentaCobro";
import type { WorkflowNotificationContractor } from "./resolveWorkflowNotificationRecipient";

export type ContractorWorkflowStatusContent = {
  mensaje: string;
  estadoLabel: string;
  actionUrl: string;
};

function buildContractorMensaje(
  estadoNuevo: CuentaCobroStatus,
  accountNumber: number
) {
  switch (estadoNuevo) {
    case "PENDIENTE_SUPERVISOR":
      return `Tu cuenta de cobro No. ${accountNumber} fue enviada correctamente y está en revisión del supervisor.`;
    case "PENDIENTE_JEFE":
      return `Tu cuenta de cobro No. ${accountNumber} fue enviada correctamente y está en revisión del jefe.`;
    case "PENDIENTE_DIRECTOR":
      return `Tu cuenta de cobro No. ${accountNumber} está en revisión del director.`;
    case "PENDIENTE_ENVIO_CAD":
      return `El director firmó tu cuenta de cobro No. ${accountNumber}. Está pendiente de envío al CAD.`;
    case "ENVIADA_CAD":
      return `Tu cuenta de cobro No. ${accountNumber} fue enviada al CAD.`;
    case "APROBADA":
      return `Tu cuenta de cobro No. ${accountNumber} fue marcada como pagada.`;
    case "PENDIENTE_CONTRATISTA":
      return `Tu cuenta de cobro No. ${accountNumber} fue devuelta para corrección.`;
    default:
      return null;
  }
}

export function resolveContractorWorkflowStatusContent(input: {
  estadoNuevo: CuentaCobroStatus;
  contractId: string;
  accountNumber: number;
  contractor: WorkflowNotificationContractor;
}): ContractorWorkflowStatusContent | null {
  const mensaje = buildContractorMensaje(input.estadoNuevo, input.accountNumber);
  if (!mensaje) return null;

  return {
    mensaje,
    estadoLabel: CUENTA_COBRO_STATUS_LABELS[input.estadoNuevo],
    actionUrl: buildAppUrl(
      getPaymentAccountHref(input.contractId, input.accountNumber)
    ),
  };
}

export function resolveReviewerRoleLabelForContractorSubmit(
  contractor: WorkflowNotificationContractor
) {
  if (contractor.organizationalUnitType === ORGANIZACION_TIPO.JEFATURA) {
    return "jefe";
  }
  if (
    !subareaHasSupervisor(
      contractor.organizationalUnitId,
      contractor.subareaId
    )
  ) {
    return "director";
  }
  return "supervisor";
}
