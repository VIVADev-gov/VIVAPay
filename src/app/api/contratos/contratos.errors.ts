export const CONTRACT_ERROR_CODES = {
  CONTRACT_NOT_FOUND: "CONTRACT_NOT_FOUND",
  CONTRACT_ALREADY_EXISTS: "CONTRACT_ALREADY_EXISTS",
  INVALID_CONTRACT_DATES: "INVALID_CONTRACT_DATES",
} as const;

export type ContractErrorCode =
  (typeof CONTRACT_ERROR_CODES)[keyof typeof CONTRACT_ERROR_CODES];

export class ContractServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
    public readonly code?: ContractErrorCode
  ) {
    super(message);
  }
}
