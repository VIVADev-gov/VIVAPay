export const VIVA_EMAIL_DOMAIN = "viva.gov.co";

export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const VERIFICATION_TOKEN_EXPIRY_HOURS = 48;
export const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1;
export const JWT_EXPIRY = "7d";

export const PASSWORD_RESET_GENERIC_MESSAGE =
  "Si existe una cuenta activa con ese correo, recibirás un enlace para restablecer tu contraseña.";
