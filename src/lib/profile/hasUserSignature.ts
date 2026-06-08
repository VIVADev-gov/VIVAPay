import type { AuthUser } from "@/store/auth/auth.storage";

export function hasUserSignature(user: AuthUser | null | undefined) {
  return Boolean(user?.signaturePath?.trim());
}

/** @deprecated Usar hasUserSignature */
export { hasUserSignature as hasContractorSignature };
