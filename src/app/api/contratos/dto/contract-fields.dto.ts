import { z } from "zod";

const positiveNumber = z.coerce.number().min(0, "El valor debe ser mayor o igual a 0");

const cdpRpcReferenceSchema = z
  .string()
  .trim()
  .regex(
    /^\d+\s+del\s+\d{2}\/\d{2}\/\d{4}$/i,
    "Formato inválido. Ejemplo: 291 del 28/01/2026"
  );

export const contractRubroAdicionalSchema = z.object({
  rubro: z.string().trim().min(1, "El rubro es obligatorio"),
  concepto: z.string().trim().min(1, "El concepto es obligatorio"),
});

export const contractCoreFieldsSchema = z.object({
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
  cdp: cdpRpcReferenceSchema,
  valorCdp: positiveNumber,
  rpc: cdpRpcReferenceSchema,
  valorRpc: positiveNumber,
  valorInicialContrato: positiveNumber.refine((v) => v > 0, {
    message: "El valor inicial del contrato debe ser mayor a 0",
  }),
  numeroDisponibilidad: z.string().trim().optional(),
  numeroCompromiso: z.string().trim().optional(),
  tieneReembolsables: z.coerce.boolean().default(false),
  rubroRembolsable: z.string().trim().optional(),
  conceptoRembolsable: z.string().trim().optional(),
  rubrosAdicionales: z.array(contractRubroAdicionalSchema).default([]),
});

export type ContractCoreFields = z.infer<typeof contractCoreFieldsSchema>;

export function validateContractDatesAndReembolsables(
  data: ContractCoreFields,
  ctx: z.RefinementCtx
) {
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

  if (data.tieneReembolsables) {
    if (!data.rubroRembolsable?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "El rubro reembolsable es obligatorio",
        path: ["rubroRembolsable"],
      });
    }
    if (!data.conceptoRembolsable?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "El concepto reembolsable es obligatorio",
        path: ["conceptoRembolsable"],
      });
    }
  }
}

export const updateContractBodySchema = contractCoreFieldsSchema.superRefine(
  validateContractDatesAndReembolsables
);

export type UpdateContractBodyDto = z.infer<typeof updateContractBodySchema>;

export const createContractBodySchema = contractCoreFieldsSchema
  .extend({
    submittedPaymentAccountsCount: z.coerce
      .number()
      .int("La cantidad de cuentas enviadas debe ser un número entero")
      .min(0, "La cantidad de cuentas enviadas no puede ser negativa")
      .max(120, "La cantidad de cuentas enviadas es demasiado alta")
      .optional()
      .default(0),
  })
  .superRefine(validateContractDatesAndReembolsables);

export type CreateContractBodyDto = z.infer<typeof createContractBodySchema>;
