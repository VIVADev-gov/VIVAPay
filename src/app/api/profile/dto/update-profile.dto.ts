import { z } from "zod";
import { AREAS_VIVA } from "@/constants/areasViva";

const validAreas = new Set<string>(AREAS_VIVA.map((area) => area.name));

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
  area: z.string().trim().refine((value) => validAreas.has(value), {
    message: "Selecciona un área válida",
  }),
});

export type UpdateProfileBodyDto = z.infer<typeof updateProfileBodySchema>;
