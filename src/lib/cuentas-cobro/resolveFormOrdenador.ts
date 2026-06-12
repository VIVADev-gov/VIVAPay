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
};

async function findActiveOrdenador(contractor: FormOrdenadorContractor) {
  if (contractor.organizationalUnitType === ORGANIZACION_TIPO.JEFATURA) {
    return User.findOne({
      role: USER_ROLES.JEFE,
      organizationalUnitId: contractor.organizationalUnitId,
      organizationalUnitType: ORGANIZACION_TIPO.JEFATURA,
      status: USER_STATUS.ACTIVE,
    })
      .select("_id name documentId role organizationalUnitName")
      .exec();
  }

  return User.findOne({
    role: USER_ROLES.DIRECTOR,
    organizationalUnitId: contractor.organizationalUnitId,
    organizationalUnitType: ORGANIZACION_TIPO.DIRECCION,
    subareaId: contractor.subareaId ?? null,
    status: USER_STATUS.ACTIVE,
  })
    .select("_id name documentId role organizationalUnitName")
    .exec();
}

export async function resolveFormOrdenador(
  contractor: FormOrdenadorContractor,
  signedUserId?: string | null
): Promise<FormOrdenador> {
  await connectDB();

  if (signedUserId && Types.ObjectId.isValid(signedUserId)) {
    const signedUser = await User.findById(signedUserId)
      .select("_id name documentId role organizationalUnitName")
      .exec();
    if (signedUser) {
      return {
        id: String(signedUser._id),
        name: signedUser.name,
        documentId: signedUser.documentId,
        role: signedUser.role,
        organizationalUnitName: signedUser.organizationalUnitName ?? "",
      };
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

  return {
    id: String(ordenador._id),
    name: ordenador.name,
    documentId: ordenador.documentId,
    role: ordenador.role,
    organizationalUnitName: ordenador.organizationalUnitName ?? "",
  };
}
