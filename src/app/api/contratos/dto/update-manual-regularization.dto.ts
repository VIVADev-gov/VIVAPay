import { z } from "zod";
import { manualPaymentDatesSchema } from "./manual-payment-dates.dto";

export const updateManualRegularizationBodySchema = z.object({
  submittedPaymentAccountsCount: z.coerce
    .number()
    .int("La cantidad de cuentas enviadas debe ser un número entero")
    .min(0, "La cantidad de cuentas enviadas no puede ser negativa")
    .max(120, "La cantidad de cuentas enviadas es demasiado alta"),
  manualPaymentDates: manualPaymentDatesSchema,
});

export type UpdateManualRegularizationBodyDto = z.infer<
  typeof updateManualRegularizationBodySchema
>;
