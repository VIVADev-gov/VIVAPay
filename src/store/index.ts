export { useUiStore, uiStore } from "./ui/ui-store";
export type { OpenModalParams, ShowToastParams, UiStore } from "./ui/ui-actions";
export type {
  ModalSize,
  TableViewMode,
  UiModalState,
  UiState,
  UiToastState,
} from "./ui/ui.storage";

export { useAuthStore } from "./auth/auth.store";
export type { AuthState, AuthUser } from "./auth/auth.storage";
export {
  initialAuthState,
  readTokenFromStorage,
  writeTokenToStorage,
  clearAuthStorage,
} from "./auth/auth.storage";

export { useRegisterStore } from "./auth/register/register.store";

export { useContratosStore } from "./contratos/contratos.store";
export type { ContratosStore } from "./contratos/contratos.actions";

export { useCuentasCobroStore } from "./cuentas-cobro/cuentas-cobro.store";
export type { CuentasCobroStore } from "./cuentas-cobro/cuentas-cobro.actions";
export type { PaymentAccountDeclarations } from "@/lib/cuentas-cobro/paymentAccountDeclarations";

export { useProfileStore } from "./profile/profile.store";
export type { ProfileStore } from "./profile/profile.actions";
