import { z } from "zod";

export const verifyEmailQuerySchema = z.object({
  token: z.string().min(1, "Token de verificación requerido"),
});

export type VerifyEmailQueryDto = z.infer<typeof verifyEmailQuerySchema>;
