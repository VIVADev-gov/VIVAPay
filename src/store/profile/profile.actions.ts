import type { StateCreator } from "zustand";
import type { AuthUser } from "@/store/auth/auth.storage";
import {
  initialProfileForm,
  initialProfileState,
  type ProfileFormState,
  type ProfileState,
} from "./profile.storage";

export type ProfileActions = {
  setProfileLoading: (loading: boolean) => void;
  setProfileSaving: (saving: boolean) => void;
  setProfileError: (error: string | null) => void;
  setProfileUser: (user: AuthUser | null) => void;
  setProfileForm: (form: Partial<ProfileFormState>) => void;
  setProfileSuccess: (message: string | null) => void;
  resetProfile: () => void;
};

export type ProfileStore = ProfileState & ProfileActions;

export const createProfileActions: StateCreator<
  ProfileStore,
  [],
  [],
  ProfileActions
> = (set) => ({
  setProfileLoading: (isLoading) => set({ isLoading }),

  setProfileSaving: (isSaving) => set({ isSaving }),

  setProfileError: (error) => set({ error, successMessage: null }),

  setProfileUser: (user) =>
    set({
      user,
      form: user
        ? {
            name: user.name ?? "",
            phone: user.phone ?? "",
            organizationalUnitId: user.organizationalUnitId ?? "",
            subareaId: user.subareaId ?? "",
          }
        : initialProfileForm,
      error: null,
    }),

  setProfileForm: (partial) =>
    set((state) => ({
      form: { ...state.form, ...partial },
      successMessage: null,
    })),

  setProfileSuccess: (successMessage) =>
    set({ successMessage, error: null, isSaving: false }),

  resetProfile: () => set({ ...initialProfileState }),
});
