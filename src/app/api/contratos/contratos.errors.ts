export const CONTRACT_ERROR_CODES = {
  CONTRACT_NOT_FOUND: "CONTRACT_NOT_FOUND",
  CONTRACT_ALREADY_EXISTS: "CONTRACT_ALREADY_EXISTS",
  INVALID_CONTRACT_DATES: "INVALID_CONTRACT_DATES",
  ACTIVE_CONTRACT_CONFLICT: "ACTIVE_CONTRACT_CONFLICT",
  PAYMENT_ACCOUNTS_BLOCK_EDIT: "PAYMENT_ACCOUNTS_BLOCK_EDIT",
  NO_CHANGES: "NO_CHANGES",
  MANUAL_REGULARIZATION_BLOCKED: "MANUAL_REGULARIZATION_BLOCKED",
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
