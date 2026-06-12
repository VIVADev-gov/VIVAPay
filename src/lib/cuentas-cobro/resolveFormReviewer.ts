import "server-only";

import { USER_STATUS } from "@/app/api/auth/_shared/auth.constants";
import { ORGANIZACION_TIPO } from "@/constants/organizacionViva";
import { USER_ROLES, type UserRole } from "@/constants/userRoles";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/user";

export type FormReviewerContractor = {
  organizationalUnitId: string;
  organizationalUnitType: string;
  subareaId?: string | null;
};

export type FormReviewer = {
  id: string;
  name: string;
  documentId: string;
  role: UserRole;
  organizationalUnitName: string;
};

function resolveReviewerRole(contractor: FormReviewerContractor): UserRole {
  if (contractor.organizationalUnitType === ORGANIZACION_TIPO.JEFATURA) {
    return USER_ROLES.JEFE;
  }
  return USER_ROLES.SUPERVISOR;
}

export async function resolveFormReviewer(
  contractor: FormReviewerContractor
): Promise<FormReviewer> {
  await connectDB();

  const role = resolveReviewerRole(contractor);
  const query =
    role === USER_ROLES.JEFE
      ? {
          role: USER_ROLES.JEFE,
          organizationalUnitId: contractor.organizationalUnitId,
          organizationalUnitType: ORGANIZACION_TIPO.JEFATURA,
          status: USER_STATUS.ACTIVE,
        }
      : {
          role: USER_ROLES.SUPERVISOR,
          organizationalUnitId: contractor.organizationalUnitId,
          organizationalUnitType: ORGANIZACION_TIPO.DIRECCION,
          subareaId: contractor.subareaId ?? null,
          status: USER_STATUS.ACTIVE,
        };

  const reviewer = await User.findOne(query)
    .select("_id name documentId role organizationalUnitName")
    .exec();

  if (!reviewer) {
    const label = role === USER_ROLES.JEFE ? "jefe" : "supervisor";
    throw new Error(
      `No se encontró ${label} activo para la unidad organizacional del contratista`
    );
  }

  return {
    id: String(reviewer._id),
    name: reviewer.name,
    documentId: reviewer.documentId,
    role: reviewer.role,
    organizationalUnitName: reviewer.organizationalUnitName ?? "",
  };
}
