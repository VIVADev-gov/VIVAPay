import { VIVA_EMAIL_DOMAIN } from "./auth.constants";

export function isVivaGovEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return normalized.endsWith(`@${VIVA_EMAIL_DOMAIN}`);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
