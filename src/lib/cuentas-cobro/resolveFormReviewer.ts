import "server-only";

import { Types } from "mongoose";
import { USER_STATUS } from "@/app/api/auth/_shared/auth.constants";
import {
  ORGANIZACION_TIPO,
  contractorUsesSupervisorWorkflow,
} from "@/constants/organizacionViva";
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
  signaturePath: string | null;
};

function resolveReviewerRole(contractor: FormReviewerContractor): UserRole {
  if (contractor.organizationalUnitType === ORGANIZACION_TIPO.JEFATURA) {
    return USER_ROLES.JEFE;
  }
  if (!contractorUsesSupervisorWorkflow(contractor)) {
    return USER_ROLES.DIRECTOR;
  }
  return USER_ROLES.SUPERVISOR;
}

function reviewerRoleLabel(role: UserRole) {
  if (role === USER_ROLES.JEFE) return "jefe";
  if (role === USER_ROLES.DIRECTOR) return "director";
  return "supervisor";
}

function toFormReviewer(user: {
  _id: unknown;
  name: string;
  documentId: string;
  role: UserRole;
  organizationalUnitName?: string | null;
  signaturePath?: string | null;
}): FormReviewer {
  return {
    id: String(user._id),
    name: user.name,
    documentId: user.documentId,
    role: user.role,
    organizationalUnitName: user.organizationalUnitName ?? "",
    signaturePath: user.signaturePath?.trim() || null,
  };
}

function buildReviewerQuery(contractor: FormReviewerContractor, role: UserRole) {
  const base = {
    role,
    organizationalUnitId: contractor.organizationalUnitId,
    status: USER_STATUS.ACTIVE,
  };

  if (role === USER_ROLES.JEFE) {
    return {
      ...base,
      organizationalUnitType: ORGANIZACION_TIPO.JEFATURA,
    };
  }

  if (role === USER_ROLES.DIRECTOR) {
    return {
      ...base,
      organizationalUnitType: ORGANIZACION_TIPO.DIRECCION,
    };
  }

  return {
    ...base,
    organizationalUnitType: ORGANIZACION_TIPO.DIRECCION,
    subareaId: contractor.subareaId ?? null,
  };
}

export async function resolveFormReviewer(
  contractor: FormReviewerContractor,
  signedUserId?: string | null
): Promise<FormReviewer> {
  await connectDB();

  if (signedUserId && Types.ObjectId.isValid(signedUserId)) {
    const signedUser = await User.findById(signedUserId)
      .select("_id name documentId role organizationalUnitName signaturePath status")
      .exec();
    if (signedUser?.status === USER_STATUS.ACTIVE) {
      return toFormReviewer(signedUser);
    }
  }

  const role = resolveReviewerRole(contractor);
  const reviewer = await User.findOne(buildReviewerQuery(contractor, role))
    .select("_id name documentId role organizationalUnitName signaturePath")
    .exec();

  if (!reviewer) {
    throw new Error(
      `No se encontró ${reviewerRoleLabel(role)} activo para la unidad organizacional del contratista`
    );
  }

  return toFormReviewer(reviewer);
}
