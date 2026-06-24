import "server-only";

import { USER_STATUS } from "@/app/api/auth/_shared/auth.constants";
import { ORGANIZACION_TIPO } from "@/constants/organizacionViva";
import { USER_ROLES, type UserRole } from "@/constants/userRoles";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/user";

export type ReviewerOrgContractor = {
  organizationalUnitId: string;
  organizationalUnitType: string;
  subareaId?: string | null;
};

export async function findReviewerEmail(
  role: UserRole,
  contractor: ReviewerOrgContractor
) {
  await connectDB();

  const baseQuery = {
    role,
    status: USER_STATUS.ACTIVE,
  };

  const query =
    role === USER_ROLES.JEFE
      ? {
          ...baseQuery,
          organizationalUnitId: contractor.organizationalUnitId,
          organizationalUnitType: ORGANIZACION_TIPO.JEFATURA,
        }
      : role === USER_ROLES.DIRECTOR
        ? {
            ...baseQuery,
            organizationalUnitId: contractor.organizationalUnitId,
            organizationalUnitType: ORGANIZACION_TIPO.DIRECCION,
          }
        : {
            ...baseQuery,
            organizationalUnitId: contractor.organizationalUnitId,
            organizationalUnitType: ORGANIZACION_TIPO.DIRECCION,
            subareaId: contractor.subareaId ?? null,
          };

  const reviewer = await User.findOne(query).select("name email").exec();
  if (!reviewer?.email?.trim()) {
    return null;
  }

  return {
    email: reviewer.email.trim(),
    name: reviewer.name,
  };
}
