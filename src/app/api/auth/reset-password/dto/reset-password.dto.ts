import { z } from "zod";
import { passwordSchema } from "../../_shared/dto/shared.dto";

export const resetPasswordBodySchema = z
  .object({
    token: z.string().trim().min(1, "El token es obligatorio"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type ResetPasswordBodyDto = z.infer<typeof resetPasswordBodySchema>;
