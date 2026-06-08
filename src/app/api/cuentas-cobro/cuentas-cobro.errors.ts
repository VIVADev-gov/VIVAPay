export const PAYMENT_ACCOUNT_ERROR_CODES = {
  CONTRACT_NOT_FOUND: "CONTRACT_NOT_FOUND",
  PAYMENT_ACCOUNT_NOT_FOUND: "PAYMENT_ACCOUNT_NOT_FOUND",
  REGENERATION_BLOCKED: "REGENERATION_BLOCKED",
  WORKFLOW_FORBIDDEN: "WORKFLOW_FORBIDDEN",
  WORKFLOW_INVALID_STATE: "WORKFLOW_INVALID_STATE",
  SIGNATURE_REQUIRED: "SIGNATURE_REQUIRED",
  RETURN_MESSAGE_REQUIRED: "RETURN_MESSAGE_REQUIRED",
} as const;

export type PaymentAccountErrorCode =
  (typeof PAYMENT_ACCOUNT_ERROR_CODES)[keyof typeof PAYMENT_ACCOUNT_ERROR_CODES];

export class PaymentAccountServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
    public readonly code?: PaymentAccountErrorCode
  ) {
    super(message);
  }
}
