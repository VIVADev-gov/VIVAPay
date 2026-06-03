import { formatDateOnly } from "@/utils/date";

export function formatDate(value?: string | Date | null) {
  if (!value) return "Sin fecha";
  const formatted = formatDateOnly(value);
  return formatted || "Sin fecha";
}

export function formatCurrency(value?: number | null) {
  if (value === undefined || value === null) return "Sin valor";

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}
