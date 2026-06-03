import type { AuthUser } from "@/store/auth/auth.storage";

export type ProfileFormState = {
  name: string;
  phone: string;
  area: string;
};

export type ProfileState = {
  user: AuthUser | null;
  form: ProfileFormState;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  successMessage: string | null;
};

export const initialProfileForm: ProfileFormState = {
  name: "",
  phone: "",
  area: "",
};

export const initialProfileState: ProfileState = {
  user: null,
  form: initialProfileForm,
  isLoading: false,
  isSaving: false,
  error: null,
  successMessage: null,
};
