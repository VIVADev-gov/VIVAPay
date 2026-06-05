import { parseDateOnlyToUtcNoon, toDateOnlyString } from "@/utils/date";

export type ContractCreationValidationInput = {
  newFechaActaInicio: Date;
  newFechaFinal: Date;
  vigenteFechaActaInicio: Date;
  vigenteFechaFinal: Date;
  today?: Date;
};

export type ContractCreationValidationResult =
  | { allowed: true }
  | { allowed: false; message: string };

export const ACTIVE_CONTRACT_CONFLICT_MESSAGE =
  "Ya tienes un contrato vigente. Solo puedes registrar un contrato anterior al actual o esperar a que finalice el contrato en curso.";

export function validateContractCreationAgainstVigente(
  input: ContractCreationValidationInput
): ContractCreationValidationResult {
  const today =
    parseDateOnlyToUtcNoon(
      toDateOnlyString(input.today ?? new Date()) ??
        new Date().toISOString().slice(0, 10)
    ) ?? input.today ?? new Date();

  const currentEnded = today.getTime() > input.vigenteFechaFinal.getTime();
  const isHistoricalBefore =
    input.newFechaFinal.getTime() < input.vigenteFechaActaInicio.getTime();

  if (currentEnded || isHistoricalBefore) {
    return { allowed: true };
  }

  return {
    allowed: false,
    message: ACTIVE_CONTRACT_CONFLICT_MESSAGE,
  };
}
