"use client";

import { create } from "zustand";
import { createProfileActions, type ProfileStore } from "./profile.actions";
import { initialProfileState } from "./profile.storage";

export const useProfileStore = create<ProfileStore>()((...args) => ({
  ...initialProfileState,
  ...createProfileActions(...args),
}));
