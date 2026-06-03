import { z } from "zod";
import { AREAS_VIVA } from "@/constants/areasViva";
import { passwordSchema, vivaEmailSchema } from "../../_shared/dto/shared.dto";

const validAreaNames = new Set<string>(AREAS_VIVA.map((area) => area.name));

export const registerBodySchema = z.object({
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
  area: z
    .string()
    .min(1, "Seleccione el área o dirección")
    .refine((area) => validAreaNames.has(area), {
      message: "Seleccione un área o dirección válida",
    }),
});

export type RegisterBodyDto = z.infer<typeof registerBodySchema>;
