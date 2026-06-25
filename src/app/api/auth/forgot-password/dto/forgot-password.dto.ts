import { z } from "zod";
import { vivaEmailSchema } from "../../_shared/dto/shared.dto";

export const forgotPasswordBodySchema = z.object({
  email: vivaEmailSchema,
});

export type ForgotPasswordBodyDto = z.infer<typeof forgotPasswordBodySchema>;
