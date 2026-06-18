import type { ContractRubroAdicional } from "@/types/contratos";

export function normalizeRubrosAdicionales(
  value: ContractRubroAdicional[] | null | undefined
): ContractRubroAdicional[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => ({
      rubro: item.rubro?.trim() ?? "",
      concepto: item.concepto?.trim() ?? "",
    }))
    .filter((item) => item.rubro || item.concepto);
}

export function formatRubrosAdicionales(
  value: ContractRubroAdicional[] | null | undefined
): string | null {
  const items = normalizeRubrosAdicionales(value);
  if (items.length === 0) {
    return null;
  }

  return items
    .map((item) => `${item.rubro} / ${item.concepto}`)
    .join("; ");
}

export function validateRubrosAdicionalesErrors(
  rubrosAdicionales: ContractRubroAdicional[]
): Record<string, string> {
  const errors: Record<string, string> = {};

  rubrosAdicionales.forEach((item, index) => {
    if (!item.rubro.trim()) {
      errors[`rubrosAdicionales.${index}.rubro`] = "Requerido";
    }
    if (!item.concepto.trim()) {
      errors[`rubrosAdicionales.${index}.concepto`] = "Requerido";
    }
  });

  return errors;
}
