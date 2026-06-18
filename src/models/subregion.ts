import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ISubregion {
  nombre: string;
  value: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ISubregionDocument = ISubregion & Document;

const subregionSchema = new Schema<ISubregionDocument>(
  {
    nombre: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    status: { type: String, default: "activo", trim: true, index: true },
  },
  { timestamps: true, collection: "subregiones" }
);

if (mongoose.models.Subregion) {
  delete mongoose.models.Subregion;
}

export const Subregion: Model<ISubregionDocument> =
  mongoose.model<ISubregionDocument>("Subregion", subregionSchema);

export function toPublicSubregion(doc: ISubregionDocument) {
  return {
    id: String(doc._id),
    nombre: doc.nombre,
    value: doc.value,
    status: doc.status,
  };
}
