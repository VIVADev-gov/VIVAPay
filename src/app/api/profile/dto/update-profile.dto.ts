import { z } from "zod";
import {
  ORGANIZACION_TIPO,
  getSubareaOrganizacional,
  getUnidadOrganizacional,
  unidadRequiereSubarea,
} from "@/constants/organizacionViva";

export const updateProfileBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "El nombre debe tener al menos 3 caracteres")
      .max(120, "El nombre es demasiado largo"),
    phone: z
      .string()
      .trim()
      .min(7, "El teléfono debe tener al menos 7 caracteres")
      .max(30, "El teléfono es demasiado largo"),
    organizationalUnitId: z
      .string()
      .trim()
      .min(1, "Seleccione la dirección o jefatura"),
    subareaId: z.string().trim().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const unidad = getUnidadOrganizacional(data.organizationalUnitId);
    if (!unidad) {
      ctx.addIssue({
        code: "custom",
        path: ["organizationalUnitId"],
        message: "Seleccione una dirección o jefatura válida",
      });
      return;
    }

    if (unidadRequiereSubarea(unidad.id)) {
      if (!data.subareaId) {
        ctx.addIssue({
          code: "custom",
          path: ["subareaId"],
          message: "Seleccione la subárea o proceso",
        });
        return;
      }

      const subarea = getSubareaOrganizacional(unidad.id, data.subareaId);
      if (!subarea) {
        ctx.addIssue({
          code: "custom",
          path: ["subareaId"],
          message: "Seleccione una subárea o proceso válida",
        });
      }
      return;
    }

    if (data.subareaId) {
      ctx.addIssue({
        code: "custom",
        path: ["subareaId"],
        message: "Las jefaturas no requieren subárea o proceso",
      });
    }
  });

export type UpdateProfileBodyDto = z.infer<typeof updateProfileBodySchema>;

export function resolveOrganizacionFromProfile(dto: UpdateProfileBodyDto) {
  const unidad = getUnidadOrganizacional(dto.organizationalUnitId);
  if (!unidad) {
    throw new Error("Unidad organizacional inválida");
  }

  const subarea =
    unidad.tipo === ORGANIZACION_TIPO.DIRECCION && dto.subareaId
      ? getSubareaOrganizacional(unidad.id, dto.subareaId)
      : null;

  return {
    organizationalUnitId: unidad.id,
    organizationalUnitName: unidad.name,
    organizationalUnitType: unidad.tipo,
    subareaId: subarea?.id ?? null,
    subareaName: subarea?.name ?? null,
  };
}
