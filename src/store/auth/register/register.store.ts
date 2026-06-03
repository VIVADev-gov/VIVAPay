import { create } from "zustand";
import { createRegisterActions, type RegisterActions } from "./register.actions";

export type RegisterState = {
  step: number;
};

export type RegisterStore = RegisterState & RegisterActions;

const initialRegisterState: RegisterState = {
  step: 0,
};

export const useRegisterStore = create<RegisterStore>()((...args) => ({
  ...initialRegisterState,
  ...createRegisterActions(...args),
}));
