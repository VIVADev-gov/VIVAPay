import { z } from "zod";
import {
  getSubareaOrganizacional,
  getUnidadOrganizacional,
  validateOrganizacionParaRol,
} from "@/constants/organizacionViva";
import type { UserRole } from "@/constants/userRoles";

export const updateProfileBodySchema = z.object({
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
});

export type UpdateProfileBodyDto = z.infer<typeof updateProfileBodySchema>;

export function validateProfileOrganizacion(
  dto: UpdateProfileBodyDto,
  role: UserRole
) {
  return validateOrganizacionParaRol({
    role,
    organizationalUnitId: dto.organizationalUnitId,
    subareaId: dto.subareaId,
  });
}

export function resolveOrganizacionFromProfile(dto: UpdateProfileBodyDto) {
  const unidad = getUnidadOrganizacional(dto.organizationalUnitId);
  if (!unidad) {
    throw new Error("Unidad organizacional inválida");
  }

  const subarea = dto.subareaId
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
