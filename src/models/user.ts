import mongoose, { Schema, type Document, type Model } from "mongoose";
import { USER_STATUS, type UserStatus } from "@/app/api/auth/_shared/auth.constants";
import {
  ORGANIZACION_TIPO,
  type OrganizacionTipo,
  formatOrganizacionDisplay,
} from "@/constants/organizacionViva";
import { USER_ROLES, type UserRole } from "@/constants/userRoles";

export interface IUser {
  email: string;
  passwordHash: string;
  name: string;
  documentId: string;
  phone: string;
  role: UserRole;
  organizationalUnitId: string;
  organizationalUnitName: string;
  organizationalUnitType: OrganizacionTipo;
  subareaId?: string | null;
  subareaName?: string | null;
  /** Campo legado; se mantiene para compatibilidad con registros antiguos. */
  area?: string;
  emailVerified: boolean;
  status: UserStatus;
  verificationTokenHash?: string | null;
  verificationTokenExpiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IUserDocument = IUser & Document;

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    documentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    phone: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.CONTRATISTA,
      required: true,
      index: true,
    },
    organizationalUnitId: { type: String, default: "", trim: true },
    organizationalUnitName: { type: String, default: "", trim: true },
    organizationalUnitType: {
      type: String,
      enum: Object.values(ORGANIZACION_TIPO),
      default: ORGANIZACION_TIPO.JEFATURA,
    },
    subareaId: { type: String, default: null, trim: true },
    subareaName: { type: String, default: null, trim: true },
    area: { type: String, trim: true },
    emailVerified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },
    verificationTokenHash: { type: String, default: null },
    verificationTokenExpiresAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "users" }
);

export const User: Model<IUserDocument> =
  mongoose.models.User ?? mongoose.model<IUserDocument>("User", userSchema);

export function toPublicUser(doc: IUserDocument) {
  const organizationalUnitType =
    doc.organizationalUnitType ?? ORGANIZACION_TIPO.JEFATURA;
  const organizationalUnitName =
    doc.organizationalUnitName ?? doc.area ?? "Sin unidad organizacional";

  return {
    id: String(doc._id),
    email: doc.email,
    name: doc.name,
    documentId: doc.documentId,
    phone: doc.phone,
    role: doc.role ?? USER_ROLES.CONTRATISTA,
    organizationalUnitId: doc.organizationalUnitId ?? "",
    organizationalUnitName,
    organizationalUnitType,
    subareaId: doc.subareaId ?? null,
    subareaName: doc.subareaName ?? null,
    area:
      doc.area ??
      formatOrganizacionDisplay({
        organizationalUnitName,
        organizationalUnitType,
        subareaName: doc.subareaName,
      }),
    emailVerified: doc.emailVerified,
    status: doc.status,
  };
}
