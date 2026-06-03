import {
  CUENTA_COBRO_STATUS,
  type ICuentaCobroDocument,
} from "@/models/cuentaCobro";
import type { PublicContrato } from "@/types/contratos";

const SUBMITTED_STATUSES = new Set<string>([
  CUENTA_COBRO_STATUS.ENVIADA,
  CUENTA_COBRO_STATUS.APROBADA,
  CUENTA_COBRO_STATUS.RECHAZADA,
]);

const PENDING_STATUSES = new Set<string>([
  CUENTA_COBRO_STATUS.BORRADOR,
  CUENTA_COBRO_STATUS.PENDIENTE,
  CUENTA_COBRO_STATUS.HABILITADA,
]);

export function enrichContractWithPaymentStats(
  contract: PublicContrato,
  accounts: Pick<ICuentaCobroDocument, "estado">[]
): PublicContrato {
  const paymentAccountCount = accounts.length;
  const submittedPaymentAccountCount = accounts.filter((account) =>
    SUBMITTED_STATUSES.has(account.estado)
  ).length;
  const hasPending = accounts.some((account) =>
    PENDING_STATUSES.has(account.estado)
  );

  const canSubmitPaymentAccount = hasPending;

  return {
    ...contract,
    paymentAccountCount,
    submittedPaymentAccountCount,
    canSubmitPaymentAccount,
  };
}
