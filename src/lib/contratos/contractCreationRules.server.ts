import {
  getCurrentContractSnapshot,
  type IContratoDocument,
} from "@/models/contrato";
import { parseDateOnlyToUtcNoon, toDateOnlyString } from "@/utils/date";
import {
  validateContractCreationAgainstVigente,
  type ContractCreationValidationResult,
} from "./contractCreationValidation";

export function findVigenteContract(contratos: IContratoDocument[]) {
  const today = parseDateOnlyToUtcNoon(
    toDateOnlyString(new Date()) ?? new Date().toISOString().slice(0, 10)
  );
  if (!today) return null;

  return (
    contratos.find((contrato) => {
      const current = getCurrentContractSnapshot(contrato);
      const inicio = parseDateOnlyToUtcNoon(current.fechaActaInicio);
      const fin = parseDateOnlyToUtcNoon(current.fechaFinal);
      return Boolean(inicio && fin && inicio <= today && fin >= today);
    }) ?? null
  );
}

export function validateNewContractForUser(
  contratos: IContratoDocument[],
  newFechaActaInicio: Date,
  newFechaFinal: Date,
  today?: Date
): ContractCreationValidationResult {
  const vigente = findVigenteContract(contratos);
  if (!vigente) return { allowed: true };

  const snapshot = getCurrentContractSnapshot(vigente);
  const vigenteInicio = parseDateOnlyToUtcNoon(snapshot.fechaActaInicio);
  const vigenteFin = parseDateOnlyToUtcNoon(snapshot.fechaFinal);

  if (!vigenteInicio || !vigenteFin) {
    return { allowed: true };
  }

  return validateContractCreationAgainstVigente({
    newFechaActaInicio,
    newFechaFinal,
    vigenteFechaActaInicio: vigenteInicio,
    vigenteFechaFinal: vigenteFin,
    today,
  });
}
