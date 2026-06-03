export const PAYMENT_ACCOUNT_ERROR_CODES = {
  CONTRACT_NOT_FOUND: "CONTRACT_NOT_FOUND",
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
