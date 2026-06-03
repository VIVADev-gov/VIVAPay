import mongoose, { Schema, type Document, type Model } from "mongoose";
import { USER_STATUS, type UserStatus } from "@/app/api/auth/_shared/auth.constants";

export interface IUser {
  email: string;
  passwordHash: string;
  name: string;
  documentId: string;
  phone: string;
  area: string;
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
    area: { type: String, required: true, trim: true },
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
  return {
    id: String(doc._id),
    email: doc.email,
    name: doc.name,
    documentId: doc.documentId,
    phone: doc.phone,
    area: doc.area,
    emailVerified: doc.emailVerified,
    status: doc.status,
  };
}
