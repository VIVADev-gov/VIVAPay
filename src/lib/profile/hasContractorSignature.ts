import type { AuthUser } from "@/store/auth/auth.storage";

export function hasContractorSignature(user: AuthUser | null | undefined) {
  return Boolean(user?.signaturePath?.trim());
}
