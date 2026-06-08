import type { UserRole } from "@/constants/userRoles";

export type SessionPayload = {
  id: string;
  email: string;
  name: string;
  status: string;
  role: UserRole;
  isDevSuperUser?: boolean;
};
