import { z } from "zod";
import { isVivaGovEmail } from "../email-domain";

export const vivaEmailSchema = z
  .email("Correo electrónico inválido")
  .refine(isVivaGovEmail, {
    message: "El correo debe ser del dominio @viva.gov.co",
  });

export const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(128, "La contraseña es demasiado larga");
