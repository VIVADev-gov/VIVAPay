export const AUTH_ERROR_CODES = {
  USER_NOT_FOUND: "USER_NOT_FOUND",
  INVALID_PASSWORD: "INVALID_PASSWORD",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  ACCOUNT_INACTIVE: "ACCOUNT_INACTIVE",
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code?: AuthErrorCode
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}
