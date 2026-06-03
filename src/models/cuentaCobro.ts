import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export const CUENTA_COBRO_STATUS = {
  BORRADOR: "BORRADOR",
  PENDIENTE: "PENDIENTE",
  HABILITADA: "HABILITADA",
  ENVIADA: "ENVIADA",
  APROBADA: "APROBADA",
  RECHAZADA: "RECHAZADA",
} as const;

export type CuentaCobroStatus =
  (typeof CUENTA_COBRO_STATUS)[keyof typeof CUENTA_COBRO_STATUS];

export interface ICuentaCobro {
  userId: Types.ObjectId;
  contratoId: Types.ObjectId;
  numero: number;
  periodoInicio: Date;
  periodoFin: Date;
  fechaHabilitadaEnvio: Date;
  fechaLimiteEnvio?: Date | null;
  fechaEnvio?: Date | null;
  estado: CuentaCobroStatus;
  valor?: number;
  observaciones?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ICuentaCobroDocument = ICuentaCobro & Document;

const cuentaCobroSchema = new Schema<ICuentaCobroDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    contratoId: {
      type: Schema.Types.ObjectId,
      ref: "Contrato",
      required: true,
      index: true,
    },
    numero: { type: Number, required: true, min: 1 },
    periodoInicio: { type: Date, required: true },
    periodoFin: { type: Date, required: true },
    fechaHabilitadaEnvio: { type: Date, required: true, index: true },
    fechaLimiteEnvio: { type: Date, default: null },
    fechaEnvio: { type: Date, default: null },
    estado: {
      type: String,
      enum: Object.values(CUENTA_COBRO_STATUS),
      default: CUENTA_COBRO_STATUS.PENDIENTE,
      index: true,
    },
    valor: { type: Number, min: 0 },
    observaciones: { type: String, trim: true },
  },
  { timestamps: true, collection: "cuentas_cobro" }
);

cuentaCobroSchema.index({ contratoId: 1, numero: 1 }, { unique: true });

export const CuentaCobro: Model<ICuentaCobroDocument> =
  mongoose.models.CuentaCobro ??
  mongoose.model<ICuentaCobroDocument>("CuentaCobro", cuentaCobroSchema);

function toDateIso(value?: Date | null) {
  return value ? value.toISOString() : null;
}

export function toPublicCuentaCobro(doc: ICuentaCobroDocument) {
  return {
    id: String(doc._id),
    userId: String(doc.userId),
    contratoId: String(doc.contratoId),
    numero: doc.numero,
    periodoInicio: toDateIso(doc.periodoInicio),
    periodoFin: toDateIso(doc.periodoFin),
    fechaHabilitadaEnvio: toDateIso(doc.fechaHabilitadaEnvio),
    fechaLimiteEnvio: toDateIso(doc.fechaLimiteEnvio),
    fechaEnvio: toDateIso(doc.fechaEnvio),
    estado: doc.estado,
    valor: doc.valor ?? null,
    observaciones: doc.observaciones ?? null,
    createdAt: toDateIso(doc.createdAt),
    updatedAt: toDateIso(doc.updatedAt),
  };
}
