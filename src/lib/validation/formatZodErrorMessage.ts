import { z } from "zod";
import { ZOD_FIELD_LABELS } from "@/lib/contratos/formatContractFormErrors";

function getFieldLabel(path: string) {
  return ZOD_FIELD_LABELS[path] ?? path.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

export function formatZodErrorMessage(error: z.ZodError) {
  const parts = error.issues.map((issue) => {
    const path = issue.path.join(".");
    const label = path ? getFieldLabel(path) : "Datos";
    return `${label}: ${issue.message}`;
  });

  return `Faltan o son inválidos los siguientes campos: ${parts.join("; ")}.`;
}
