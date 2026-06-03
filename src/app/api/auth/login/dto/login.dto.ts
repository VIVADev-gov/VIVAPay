import { z } from "zod";
import { isVivaGovEmail } from "../../_shared/email-domain";
import { passwordSchema } from "../../_shared/dto/shared.dto";

export const loginBodySchema = z
  .object({
    identifier: z.string().min(1, "Ingrese correo o documento de identidad"),
    password: passwordSchema,
  })
  .superRefine((data, ctx) => {
    const id = data.identifier.trim();
    if (id.includes("@") && !isVivaGovEmail(id)) {
      ctx.addIssue({
        code: "custom",
        message: "El correo debe ser del dominio @viva.gov.co",
        path: ["identifier"],
      });
    }
  });

export type LoginBodyDto = z.infer<typeof loginBodySchema>;
