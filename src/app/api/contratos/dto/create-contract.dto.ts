import { z } from "zod";

const positiveNumber = z.coerce.number().min(0, "El valor debe ser mayor o igual a 0");

export const createContractBodySchema = z
  .object({
    numeroContrato: z.string().trim().min(1, "El número de contrato es obligatorio"),
    objeto: z.string().trim().min(3, "El objeto es obligatorio"),
    plazoMeses: z.coerce
      .number()
      .int("El plazo debe ser un número entero")
      .min(1, "El plazo debe ser al menos 1 mes")
      .max(120, "El plazo es demasiado largo"),
    fechaActaInicio: z.string().min(1, "La fecha de acta de inicio es obligatoria"),
    fechaFinal: z.string().min(1, "La fecha final es obligatoria"),
    concepto: z.string().trim().min(1, "El concepto es obligatorio"),
    rubro: z.string().trim().min(1, "El rubro es obligatorio"),
    cdp: z.string().trim().min(1, "El CDP es obligatorio"),
    valorCdp: positiveNumber,
    rpc: z.string().trim().min(1, "El RPC es obligatorio"),
    valorRpc: positiveNumber,
    valorInicialContrato: positiveNumber.refine((v) => v > 0, {
      message: "El valor inicial del contrato debe ser mayor a 0",
    }),
    numeroDisponibilidad: z
      .string()
      .trim()
      .min(1, "El número de disponibilidad es obligatorio"),
    numeroCompromiso: z.string().trim().min(1, "El número de compromiso es obligatorio"),
    submittedPaymentAccountsCount: z.coerce
      .number()
      .int("La cantidad de cuentas enviadas debe ser un número entero")
      .min(0, "La cantidad de cuentas enviadas no puede ser negativa")
      .max(120, "La cantidad de cuentas enviadas es demasiado alta")
      .optional()
      .default(0),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.fechaActaInicio);
    const end = new Date(data.fechaFinal);

    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({
        code: "custom",
        message: "Fecha de acta de inicio inválida",
        path: ["fechaActaInicio"],
      });
    }

    if (Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: "custom",
        message: "Fecha final inválida",
        path: ["fechaFinal"],
      });
    }

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end < start) {
      ctx.addIssue({
        code: "custom",
        message: "La fecha final debe ser posterior a la fecha de acta de inicio",
        path: ["fechaFinal"],
      });
    }
  });

export type CreateContractBodyDto = z.infer<typeof createContractBodySchema>;
