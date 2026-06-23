import type { CuentaCobroStatus } from "@/types/contratos";

export function resolveInitialStatus(
  fechaHabilitadaEnvio: Date,
  fechaLimiteEnvio: Date,
  today: Date = new Date()
): CuentaCobroStatus {
  if (fechaHabilitadaEnvio <= today && fechaLimiteEnvio >= today) {
    return "HABILITADA";
  }
  return "PENDIENTE";
}
