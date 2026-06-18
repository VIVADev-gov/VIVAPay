import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IMunicipio {
  nombre: string;
  value: string;
  subregion: Types.ObjectId;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IMunicipioDocument = IMunicipio & Document;

const municipioSchema = new Schema<IMunicipioDocument>(
  {
    nombre: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    subregion: {
      type: Schema.Types.ObjectId,
      ref: "Subregion",
      required: true,
      index: true,
    },
    status: { type: String, default: "activo", trim: true, index: true },
  },
  { timestamps: true, collection: "municipios" }
);

if (mongoose.models.Municipio) {
  delete mongoose.models.Municipio;
}

export const Municipio: Model<IMunicipioDocument> =
  mongoose.model<IMunicipioDocument>("Municipio", municipioSchema);

export function toPublicMunicipio(doc: IMunicipioDocument) {
  return {
    id: String(doc._id),
    nombre: doc.nombre,
    value: doc.value,
    subregionId: String(doc.subregion),
    status: doc.status,
  };
}
