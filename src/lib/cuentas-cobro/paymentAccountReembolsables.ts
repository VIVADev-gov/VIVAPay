import type { PublicContrato } from "@/types/contratos";

export const TIPOS_TRANSPORTE = [
  "Terrestre",
  "Aéreo",
  "Fluvial",
  "Otro",
] as const;

export type TipoTransporte = (typeof TIPOS_TRANSPORTE)[number];

export const MAX_ENCARGOS_COMISION = 8;

export type EncargoComision = {
  id: string;
  municipioId: string;
  municipioNombre: string;
  subregionId: string;
  subregionNombre: string;
  otrosDestinos?: string;
  fechaSalida: string;
  fechaRegreso: string;
  pernocta: boolean;
  tipoTransporte: TipoTransporte;
};

export type PaymentAccountReembolsables = {
  encargos: EncargoComision[];
  cumplimientoObjetivos?: string;
  observaciones?: string;
};

export type ReembolsablesPrefills = {
  documentId: string;
  name: string;
  organizationalUnitName: string;
  numeroContrato: string;
  rubroRembolsable: string | null;
  conceptoRembolsable: string | null;
  periodoInicio: string | null;
  periodoFin: string | null;
  cuentaNumero: number;
  coordinadorNombre: string;
  modalidad: "CONTRATISTA";
  periodoCorte: "1/15" | "16/30";
};

export type CuentaCobroReembolsablesResponse = {
  responses: PaymentAccountReembolsables | null;
  prefills: ReembolsablesPrefills;
};

export const defaultPaymentAccountReembolsables: PaymentAccountReembolsables = {
  encargos: [],
  cumplimientoObjetivos: "",
  observaciones: "",
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseIsoDateOnly(value: unknown): string | null {
  if (!isNonEmptyString(value)) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function parseEncargoComision(value: unknown, index: number): EncargoComision | null {
  if (!value || typeof value !== "object") return null;

  const item = value as Record<string, unknown>;
  const fechaSalida = parseIsoDateOnly(item.fechaSalida);
  const fechaRegreso = parseIsoDateOnly(item.fechaRegreso);
  const tipoTransporte = item.tipoTransporte;

  if (
    !isNonEmptyString(item.municipioId) ||
    !isNonEmptyString(item.municipioNombre) ||
    !isNonEmptyString(item.subregionId) ||
    !isNonEmptyString(item.subregionNombre) ||
    !fechaSalida ||
    !fechaRegreso ||
    typeof tipoTransporte !== "string" ||
    !TIPOS_TRANSPORTE.includes(tipoTransporte as TipoTransporte)
  ) {
    return null;
  }

  if (fechaRegreso < fechaSalida) {
    return null;
  }

  const id = isNonEmptyString(item.id)
    ? item.id.trim()
    : String(index + 1).padStart(5, "0");

  return {
    id,
    municipioId: item.municipioId.trim(),
    municipioNombre: item.municipioNombre.trim(),
    subregionId: item.subregionId.trim(),
    subregionNombre: item.subregionNombre.trim(),
    otrosDestinos: isNonEmptyString(item.otrosDestinos)
      ? item.otrosDestinos.trim()
      : undefined,
    fechaSalida,
    fechaRegreso,
    pernocta: item.pernocta === true,
    tipoTransporte: tipoTransporte as TipoTransporte,
  };
}

export function parsePaymentAccountReembolsables(
  value: unknown
): PaymentAccountReembolsables | null {
  if (value == null) return null;
  if (typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.encargos)) return null;

  if (raw.encargos.length === 0 || raw.encargos.length > MAX_ENCARGOS_COMISION) {
    return null;
  }

  const encargos: EncargoComision[] = [];
  for (let index = 0; index < raw.encargos.length; index++) {
    const parsed = parseEncargoComision(raw.encargos[index], index);
    if (!parsed) return null;
    encargos.push(parsed);
  }

  return {
    encargos,
    cumplimientoObjetivos: isNonEmptyString(raw.cumplimientoObjetivos)
      ? raw.cumplimientoObjetivos.trim()
      : undefined,
    observaciones: isNonEmptyString(raw.observaciones)
      ? raw.observaciones.trim()
      : undefined,
  };
}

export function isReembolsablesComplete(
  value: PaymentAccountReembolsables | null | undefined
): boolean {
  return parsePaymentAccountReembolsables(value) != null;
}

export function contractRequiresReembolsables(
  contract: Pick<PublicContrato, "tieneReembolsables">
): boolean {
  return contract.tieneReembolsables === true;
}

export function formatReembolsablesContractSummary(
  contract: Pick<
    PublicContrato,
    "rubroRembolsable" | "conceptoRembolsable"
  >
): string {
  const parts = [
    contract.rubroRembolsable?.trim(),
    contract.conceptoRembolsable?.trim(),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "Sin datos de reembolsables";
}

export function formatReembolsablesSummary(
  value: PaymentAccountReembolsables | null | undefined
): string {
  const parsed = parsePaymentAccountReembolsables(value);
  if (!parsed) return "Pendiente de completar";

  const count = parsed.encargos.length;
  const first = parsed.encargos[0];
  const suffix =
    count === 1
      ? `${first.municipioNombre} (${first.subregionNombre})`
      : `${count} encargos registrados`;

  return suffix;
}

export function derivePeriodoCorte(
  periodoInicio: string | Date | null | undefined
): "1/15" | "16/30" {
  if (!periodoInicio) return "1/15";
  const date = new Date(periodoInicio);
  if (Number.isNaN(date.getTime())) return "1/15";
  return date.getUTCDate() <= 15 ? "1/15" : "16/30";
}

export function createEmptyEncargoComision(index: number): EncargoComision {
  return {
    id: String(index + 1).padStart(5, "0"),
    municipioId: "",
    municipioNombre: "",
    subregionId: "",
    subregionNombre: "",
    otrosDestinos: "",
    fechaSalida: "",
    fechaRegreso: "",
    pernocta: false,
    tipoTransporte: "Terrestre",
  };
}
