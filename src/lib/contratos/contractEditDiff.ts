import { getContractFormFieldLabel } from "@/lib/contratos/formatContractFormErrors";
import {
  formatRubrosAdicionales,
  normalizeRubrosAdicionales,
} from "@/lib/contratos/contractRubrosAdicionales";
import type { IContractFieldChange, IContratoDocument } from "@/models/contrato";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { parseDateOnlyToUtcNoon } from "@/utils/date";
import type { UpdateContractBodyDto } from "@/app/api/contratos/dto/update-contract.dto";

export const CONTRACT_FIELDS_BLOCKED_WITH_PAYMENT_ACCOUNTS = [
  "fechaActaInicio",
  "fechaFinal",
  "plazoMeses",
  "valorInicialContrato",
] as const;

export type ContractEditableField = keyof UpdateContractBodyDto;

const EDITABLE_FIELDS: ContractEditableField[] = [
  "numeroContrato",
  "objeto",
  "plazoMeses",
  "fechaActaInicio",
  "fechaFinal",
  "concepto",
  "rubro",
  "cdp",
  "valorCdp",
  "rpc",
  "valorRpc",
  "valorInicialContrato",
  "tieneReembolsables",
  "rubroRembolsable",
  "conceptoRembolsable",
  "rubrosAdicionales",
];

const DATE_FIELDS = new Set(["fechaActaInicio", "fechaFinal"]);
const CURRENCY_FIELDS = new Set(["valorCdp", "valorRpc", "valorInicialContrato"]);
const BOOLEAN_FIELDS = new Set(["tieneReembolsables"]);
const ARRAY_FIELDS = new Set(["rubrosAdicionales"]);

function normalizeComparableValue(
  field: string,
  value: unknown
): string | number | boolean | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (BOOLEAN_FIELDS.has(field)) {
    return Boolean(value);
  }

  if (DATE_FIELDS.has(field)) {
    const parsed =
      value instanceof Date
        ? value
        : parseDateOnlyToUtcNoon(String(value));
    return parsed ? parsed.toISOString().slice(0, 10) : null;
  }

  if (CURRENCY_FIELDS.has(field) || field === "plazoMeses") {
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  }

  if (ARRAY_FIELDS.has(field)) {
    return formatRubrosAdicionales(
      normalizeRubrosAdicionales(
        value as Parameters<typeof normalizeRubrosAdicionales>[0]
      )
    );
  }

  return String(value).trim();
}

export function serializeContractFieldValue(
  field: string,
  value: unknown
): string | null {
  const normalized = normalizeComparableValue(field, value);

  if (normalized === null) {
    return null;
  }

  if (BOOLEAN_FIELDS.has(field)) {
    return normalized ? "Sí" : "No";
  }

  if (DATE_FIELDS.has(field)) {
    const parsed = parseDateOnlyToUtcNoon(String(normalized));
    return parsed ? formatDate(parsed) : String(normalized);
  }

  if (CURRENCY_FIELDS.has(field)) {
    return formatCurrency(typeof normalized === "number" ? normalized : null);
  }

  if (ARRAY_FIELDS.has(field)) {
    return typeof normalized === "string" ? normalized : null;
  }

  return String(normalized);
}

function getDocumentFieldValue(
  doc: IContratoDocument,
  field: ContractEditableField
): unknown {
  switch (field) {
    case "fechaActaInicio":
      return doc.fechaActaInicio;
    case "fechaFinal":
      return doc.fechaFinal;
    case "numeroDisponibilidad":
      return doc.numeroDisponibilidad;
    case "tieneReembolsables":
      return doc.tieneReembolsables ?? false;
    case "rubroRembolsable":
      return doc.rubroRembolsable ?? null;
    case "conceptoRembolsable":
      return doc.conceptoRembolsable ?? null;
    case "rubrosAdicionales":
      return doc.rubrosAdicionales ?? [];
    default:
      return doc[field as keyof IContratoDocument];
  }
}

function getDtoFieldValue(
  dto: UpdateContractBodyDto,
  field: ContractEditableField
): unknown {
  if (field === "rubroRembolsable" || field === "conceptoRembolsable") {
    return dto.tieneReembolsables ? dto[field]?.trim() ?? null : null;
  }

  if (field === "rubrosAdicionales") {
    return normalizeRubrosAdicionales(dto.rubrosAdicionales);
  }

  if (field === "fechaActaInicio" || field === "fechaFinal") {
    return parseDateOnlyToUtcNoon(dto[field]);
  }

  return dto[field];
}

export function hasBlockedFieldChanges(
  doc: IContratoDocument,
  dto: UpdateContractBodyDto
): boolean {
  return CONTRACT_FIELDS_BLOCKED_WITH_PAYMENT_ACCOUNTS.some((field) => {
    const before = normalizeComparableValue(
      field,
      getDocumentFieldValue(doc, field)
    );
    const after = normalizeComparableValue(field, getDtoFieldValue(dto, field));
    return before !== after;
  });
}

export function buildContractEditChanges(
  doc: IContratoDocument,
  dto: UpdateContractBodyDto
): IContractFieldChange[] {
  const changes: IContractFieldChange[] = [];

  for (const field of EDITABLE_FIELDS) {
    const before = getDocumentFieldValue(doc, field);
    const after = getDtoFieldValue(dto, field);

    const beforeNorm = normalizeComparableValue(field, before);
    const afterNorm = normalizeComparableValue(field, after);

    if (beforeNorm === afterNorm) {
      continue;
    }

    changes.push({
      campo: field,
      etiqueta: getContractFormFieldLabel(field),
      valorAnterior: serializeContractFieldValue(field, before),
      valorNuevo: serializeContractFieldValue(field, after),
    });
  }

  const rpcBefore = normalizeComparableValue("rpc", doc.rpc);
  const rpcAfter = normalizeComparableValue("rpc", dto.rpc.trim());
  const disponibilidadBefore = normalizeComparableValue(
    "numeroDisponibilidad",
    doc.numeroDisponibilidad
  );
  const disponibilidadAfter = rpcAfter;

  if (
    disponibilidadBefore !== disponibilidadAfter &&
    !changes.some((c) => c.campo === "numeroDisponibilidad")
  ) {
    changes.push({
      campo: "numeroDisponibilidad",
      etiqueta: getContractFormFieldLabel("numeroDisponibilidad"),
      valorAnterior: serializeContractFieldValue(
        "numeroDisponibilidad",
        doc.numeroDisponibilidad
      ),
      valorNuevo: serializeContractFieldValue(
        "numeroDisponibilidad",
        dto.rpc.trim()
      ),
    });
  }

  const compromisoBefore = normalizeComparableValue(
    "numeroCompromiso",
    doc.numeroCompromiso
  );
  const compromisoAfter = rpcAfter;

  if (
    compromisoBefore !== compromisoAfter &&
    !changes.some((c) => c.campo === "numeroCompromiso")
  ) {
    changes.push({
      campo: "numeroCompromiso",
      etiqueta: getContractFormFieldLabel("numeroCompromiso"),
      valorAnterior: serializeContractFieldValue(
        "numeroCompromiso",
        doc.numeroCompromiso
      ),
      valorNuevo: serializeContractFieldValue(
        "numeroCompromiso",
        dto.rpc.trim()
      ),
    });
  }

  return changes;
}

export function buildContractUpdatePayload(dto: UpdateContractBodyDto) {
  const fechaActaInicio = parseDateOnlyToUtcNoon(dto.fechaActaInicio);
  const fechaFinal = parseDateOnlyToUtcNoon(dto.fechaFinal);
  const rpc = dto.rpc.trim();

  return {
    numeroContrato: dto.numeroContrato.trim(),
    objeto: dto.objeto.trim(),
    plazoMeses: dto.plazoMeses,
    fechaActaInicio,
    fechaFinal,
    concepto: dto.concepto.trim(),
    rubro: dto.rubro.trim(),
    cdp: dto.cdp.trim(),
    valorCdp: dto.valorCdp,
    rpc,
    valorRpc: dto.valorRpc,
    valorInicialContrato: dto.valorInicialContrato,
    numeroDisponibilidad: dto.numeroDisponibilidad?.trim() || rpc,
    numeroCompromiso: dto.numeroCompromiso?.trim() || rpc,
    tieneReembolsables: dto.tieneReembolsables,
    rubroRembolsable: dto.tieneReembolsables
      ? dto.rubroRembolsable?.trim() || undefined
      : undefined,
    conceptoRembolsable: dto.tieneReembolsables
      ? dto.conceptoRembolsable?.trim() || undefined
      : undefined,
    rubrosAdicionales: normalizeRubrosAdicionales(dto.rubrosAdicionales),
  };
}
