import { z } from "zod";
import {
  ORGANIZACION_TIPO,
  getSubareaOrganizacional,
  getUnidadOrganizacional,
  unidadRequiereSubarea,
} from "@/constants/organizacionViva";
import { USER_ROLES } from "@/constants/userRoles";
import { passwordSchema, vivaEmailSchema } from "../../_shared/dto/shared.dto";

export const registerBodySchema = z
  .object({
    email: vivaEmailSchema,
    password: passwordSchema,
    name: z.string().min(2, "El nombre es obligatorio").max(120),
    documentId: z
      .string()
      .min(5, "Documento de identidad inválido")
      .max(20)
      .regex(/^[0-9]+$/, "El documento solo debe contener números"),
    phone: z
      .string()
      .min(7, "Teléfono inválido")
      .max(20)
      .regex(/^[0-9+\s()-]+$/, "Teléfono inválido"),
    role: z.enum(
      [
        USER_ROLES.CONTRATISTA,
        USER_ROLES.SUPERVISOR,
        USER_ROLES.JEFE,
        USER_ROLES.DIRECTOR,
      ],
      { message: "Seleccione un rol válido" }
    ),
    organizationalUnitId: z
      .string()
      .min(1, "Seleccione la dirección o jefatura"),
    subareaId: z.string().optional(),
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

export type RegisterBodyDto = z.infer<typeof registerBodySchema>;

export function resolveOrganizacionFromRegister(dto: RegisterBodyDto) {
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
