import type { GfrFo11Responses } from "@/types/contratos";

export type { GfrFo11Responses };

export const GFR_FO_11_UVT_THRESHOLD = 3500;

export function computeGfrFo11ThresholdAnswer(monto: number, uvt: number) {
  return monto > GFR_FO_11_UVT_THRESHOLD * uvt;
}

function parseNonNegativeNumber(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
}

function parseBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

export function parseGfrFo11Responses(value: unknown): GfrFo11Responses | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const ingresosAnioAnterior = parseNonNegativeNumber(record.ingresosAnioAnterior);
  const ingresosAnioActual = parseNonNegativeNumber(record.ingresosAnioActual);
  const multiplesEstablecimientos = parseBoolean(record.multiplesEstablecimientos);
  const establecimientoDesarrolloActividad = parseBoolean(
    record.establecimientoDesarrolloActividad
  );
  const usuarioAduanero = parseBoolean(record.usuarioAduanero);
  const contratosServiciosAnioAnterior = parseNonNegativeNumber(
    record.contratosServiciosAnioAnterior
  );
  const contratosServiciosAnioActual = parseNonNegativeNumber(
    record.contratosServiciosAnioActual
  );
  const contratosEstadoAnioAnterior = parseNonNegativeNumber(
    record.contratosEstadoAnioAnterior
  );
  const contratosEstadoAnioActual = parseNonNegativeNumber(
    record.contratosEstadoAnioActual
  );
  const consignacionesAnioAnterior = parseNonNegativeNumber(
    record.consignacionesAnioAnterior
  );
  const consignacionesAnioActual = parseNonNegativeNumber(
    record.consignacionesAnioActual
  );
  const regimenSimple = parseBoolean(record.regimenSimple);

  if (
    ingresosAnioAnterior === null ||
    ingresosAnioActual === null ||
    multiplesEstablecimientos === null ||
    establecimientoDesarrolloActividad === null ||
    usuarioAduanero === null ||
    contratosServiciosAnioAnterior === null ||
    contratosServiciosAnioActual === null ||
    contratosEstadoAnioAnterior === null ||
    contratosEstadoAnioActual === null ||
    consignacionesAnioAnterior === null ||
    consignacionesAnioActual === null ||
    regimenSimple === null
  ) {
    return null;
  }

  return {
    ingresosAnioAnterior,
    ingresosAnioActual,
    multiplesEstablecimientos,
    establecimientoDesarrolloActividad,
    usuarioAduanero,
    contratosServiciosAnioAnterior,
    contratosServiciosAnioActual,
    contratosEstadoAnioAnterior,
    contratosEstadoAnioActual,
    consignacionesAnioAnterior,
    consignacionesAnioActual,
    regimenSimple,
  };
}

function formatSiNo(value: boolean) {
  return value ? "Sí" : "No";
}

export function formatGfrFo11Summary(responses: GfrFo11Responses) {
  return [
    `Múltiples establecimientos: ${formatSiNo(responses.multiplesEstablecimientos)}`,
    `Establecimiento de actividad: ${formatSiNo(responses.establecimientoDesarrolloActividad)}`,
    `Usuario aduanero: ${formatSiNo(responses.usuarioAduanero)}`,
    `Régimen Simple: ${formatSiNo(responses.regimenSimple)}`,
  ].join(" · ");
}
