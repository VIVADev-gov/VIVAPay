export const USER_ROLES = {
  CONTRATISTA: "CONTRATISTA",
  SUPERVISOR: "SUPERVISOR",
  JEFE: "JEFE",
  DIRECTOR: "DIRECTOR",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_ROLE_OPTIONS = [
  { value: USER_ROLES.CONTRATISTA, label: "Contratista" },
  { value: USER_ROLES.SUPERVISOR, label: "Supervisor" },
  { value: USER_ROLES.JEFE, label: "Jefe" },
  { value: USER_ROLES.DIRECTOR, label: "Director" },
] as const;
