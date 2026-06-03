export const VIVA_EMAIL_DOMAIN = "viva.gov.co";

export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const VERIFICATION_TOKEN_EXPIRY_HOURS = 48;
export const JWT_EXPIRY = "7d";
