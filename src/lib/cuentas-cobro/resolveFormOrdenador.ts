import "server-only";

import { Types } from "mongoose";
import { USER_STATUS } from "@/app/api/auth/_shared/auth.constants";
import { ORGANIZACION_TIPO } from "@/constants/organizacionViva";
import { USER_ROLES } from "@/constants/userRoles";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/user";

export type FormOrdenadorContractor = {
  organizationalUnitId: string;
  organizationalUnitType: string;
  subareaId?: string | null;
};

export type FormOrdenador = {
  id: string;
  name: string;
  documentId: string;
  role: string;
  organizationalUnitName: string;
  signaturePath: string | null;
};

function toFormOrdenador(user: {
  _id: unknown;
  name: string;
  documentId: string;
  role: string;
  organizationalUnitName?: string | null;
  signaturePath?: string | null;
}): FormOrdenador {
  return {
    id: String(user._id),
    name: user.name,
    documentId: user.documentId,
    role: user.role,
    organizationalUnitName: user.organizationalUnitName ?? "",
    signaturePath: user.signaturePath?.trim() || null,
  };
}

async function findActiveOrdenador(contractor: FormOrdenadorContractor) {
  if (contractor.organizationalUnitType === ORGANIZACION_TIPO.JEFATURA) {
    return User.findOne({
      role: USER_ROLES.JEFE,
      organizationalUnitId: contractor.organizationalUnitId,
      organizationalUnitType: ORGANIZACION_TIPO.JEFATURA,
      status: USER_STATUS.ACTIVE,
    })
      .select("_id name documentId role organizationalUnitName signaturePath")
      .exec();
  }

  return User.findOne({
    role: USER_ROLES.DIRECTOR,
    organizationalUnitId: contractor.organizationalUnitId,
    organizationalUnitType: ORGANIZACION_TIPO.DIRECCION,
    status: USER_STATUS.ACTIVE,
  })
    .select("_id name documentId role organizationalUnitName signaturePath")
    .exec();
}

export async function resolveFormOrdenador(
  contractor: FormOrdenadorContractor,
  signedUserId?: string | null
): Promise<FormOrdenador> {
  await connectDB();

  if (signedUserId && Types.ObjectId.isValid(signedUserId)) {
    const signedUser = await User.findById(signedUserId)
      .select("_id name documentId role organizationalUnitName signaturePath")
      .exec();
    if (signedUser) {
      return toFormOrdenador(signedUser);
    }
  }

  const ordenador = await findActiveOrdenador(contractor);
  if (!ordenador) {
    const label =
      contractor.organizationalUnitType === ORGANIZACION_TIPO.JEFATURA
        ? "jefe"
        : "director";
    throw new Error(
      `No se encontró ${label} activo para la unidad organizacional del contratista`
    );
  }

  return toFormOrdenador(ordenador);
}
