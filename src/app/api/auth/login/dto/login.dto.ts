import { z } from "zod";
import { USER_ROLES } from "@/constants/userRoles";
import { isVivaGovEmail } from "../../_shared/email-domain";

export const loginBodySchema = z
  .object({
    identifier: z.string().min(1, "Ingrese correo o documento de identidad"),
    password: z.string().min(1, "Ingrese su contraseña"),
    devRole: z
      .enum([
        USER_ROLES.CONTRATISTA,
        USER_ROLES.SUPERVISOR,
        USER_ROLES.JEFE,
        USER_ROLES.DIRECTOR,
      ])
      .optional(),
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
