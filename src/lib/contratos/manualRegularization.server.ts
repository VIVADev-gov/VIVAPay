import { getManualRegularizationBoundary } from "@/lib/contratos/manualRegularization.shared";
import { resolveInitialStatus } from "@/lib/contratos/paymentAccountInitialStatus";
import {
  CUENTA_COBRO_STATUS,
  type CuentaCobroStatus,
  type ICuentaCobroDocument,
} from "@/models/cuentaCobro";

const PENDING_FOR_MANUAL_MARK = new Set<CuentaCobroStatus>([
  CUENTA_COBRO_STATUS.BORRADOR,
  CUENTA_COBRO_STATUS.PENDIENTE,
  CUENTA_COBRO_STATUS.HABILITADA,
  CUENTA_COBRO_STATUS.PENDIENTE_CONTRATISTA,
]);

export type ManualRegularizationUpdate = {
  accountId: string;
  set: {
    envioManual: boolean;
    estado: CuentaCobroStatus;
    fechaEnvio: Date | null;
  };
};

function resolveRestoredInitialStatus(
  account: Pick<
    ICuentaCobroDocument,
    "fechaHabilitadaEnvio" | "fechaLimiteEnvio"
  >
) {
  const fechaLimiteEnvio =
    account.fechaLimiteEnvio ?? account.fechaHabilitadaEnvio;
  return resolveInitialStatus(
    account.fechaHabilitadaEnvio,
    fechaLimiteEnvio,
    new Date()
  );
}

export function buildManualRegularizationUpdatesForAccounts(
  accounts: ICuentaCobroDocument[],
  newCount: number
): ManualRegularizationUpdate[] {
  const sorted = [...accounts].sort((a, b) => a.numero - b.numero);
  const boundary = getManualRegularizationBoundary(sorted);
  const clampedCount = Math.max(0, Math.min(newCount, boundary));
  const updates: ManualRegularizationUpdate[] = [];

  for (const account of sorted) {
    if (account.numero > boundary) continue;

    const shouldBeManual = account.numero <= clampedCount;
    const isCurrentlyManual = Boolean(account.envioManual);

    if (shouldBeManual && !isCurrentlyManual) {
      if (!PENDING_FOR_MANUAL_MARK.has(account.estado)) {
        continue;
      }
      updates.push({
        accountId: String(account._id),
        set: {
          envioManual: true,
          estado: CUENTA_COBRO_STATUS.ENVIADA,
          fechaEnvio: new Date(),
        },
      });
      continue;
    }

    if (!shouldBeManual && isCurrentlyManual) {
      updates.push({
        accountId: String(account._id),
        set: {
          envioManual: false,
          estado: resolveRestoredInitialStatus(account),
          fechaEnvio: null,
        },
      });
    }
  }

  return updates;
}

export { getManualRegularizationBoundary };
