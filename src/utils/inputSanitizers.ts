export function sanitizeDigitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function sanitizePhoneInput(value: string) {
  return value.replace(/[^0-9+\s()-]/g, "");
}

export function sanitizePersonName(value: string) {
  return value.replace(/[^\p{L}\s'-]/gu, "");
}

export function sanitizeEmailInput(value: string) {
  return value.replace(/[^a-zA-Z0-9@._+-]/g, "");
}

export const REGISTER_FIELD_SANITIZERS = {
  name: sanitizePersonName,
  email: sanitizeEmailInput,
  documentId: sanitizeDigitsOnly,
  phone: sanitizePhoneInput,
} as const;

export const PROFILE_FIELD_SANITIZERS = {
  name: sanitizePersonName,
  phone: sanitizePhoneInput,
} as const;

export function sanitizeRegisterField(name: string, value: string) {
  if (name in REGISTER_FIELD_SANITIZERS) {
    return REGISTER_FIELD_SANITIZERS[
      name as keyof typeof REGISTER_FIELD_SANITIZERS
    ](value);
  }
  return value;
}

export function sanitizeProfileField(name: string, value: string) {
  if (name in PROFILE_FIELD_SANITIZERS) {
    return PROFILE_FIELD_SANITIZERS[
      name as keyof typeof PROFILE_FIELD_SANITIZERS
    ](value);
  }
  return value;
}
