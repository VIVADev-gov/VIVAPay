import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export const CUENTA_COBRO_ACTIVIDAD_SOPORTE_TIPO = {
  TEXTO: "TEXTO",
  ARCHIVO: "ARCHIVO",
} as const;

export type CuentaCobroActividadSoporteTipo =
  (typeof CUENTA_COBRO_ACTIVIDAD_SOPORTE_TIPO)[keyof typeof CUENTA_COBRO_ACTIVIDAD_SOPORTE_TIPO];

export interface ICuentaCobroActividadItem {
  orden: number;
  actividad: string;
  accion: string;
  soporteTipo: CuentaCobroActividadSoporteTipo;
  soporteTexto?: string | null;
  soporteArchivoPath?: string | null;
  soporteArchivoNombre?: string | null;
  soporteArchivoMimeType?: string | null;
  soporteArchivoSize?: number | null;
  ejecucion: number;
}

export interface ICuentaCobroActividad {
  userId: Types.ObjectId;
  contratoId: Types.ObjectId;
  cuentaCobroId: Types.ObjectId;
  numeroCuenta: number;
  numeroContrato: string;
  actividades: ICuentaCobroActividadItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type ICuentaCobroActividadDocument = ICuentaCobroActividad & Document;

const cuentaCobroActividadItemSchema = new Schema<ICuentaCobroActividadItem>(
  {
    orden: { type: Number, required: true, min: 1 },
    actividad: { type: String, required: true, trim: true },
    accion: { type: String, required: true, trim: true },
    soporteTipo: {
      type: String,
      enum: Object.values(CUENTA_COBRO_ACTIVIDAD_SOPORTE_TIPO),
      required: true,
    },
    soporteTexto: { type: String, default: null, trim: true },
    soporteArchivoPath: { type: String, default: null, trim: true },
    soporteArchivoNombre: { type: String, default: null, trim: true },
    soporteArchivoMimeType: { type: String, default: null, trim: true },
    soporteArchivoSize: { type: Number, default: null, min: 0 },
    ejecucion: { type: Number, required: true, min: 0, max: 100, default: 100 },
  },
  { _id: true }
);

const cuentaCobroActividadSchema = new Schema<ICuentaCobroActividadDocument>(
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
    cuentaCobroId: {
      type: Schema.Types.ObjectId,
      ref: "CuentaCobro",
      required: true,
      index: true,
    },
    numeroCuenta: { type: Number, required: true, min: 1, index: true },
    numeroContrato: { type: String, required: true, trim: true, index: true },
    actividades: {
      type: [cuentaCobroActividadItemSchema],
      default: [],
    },
  },
  { timestamps: true, collection: "cuentas_cobro_actividades" }
);

cuentaCobroActividadSchema.index(
  { cuentaCobroId: 1 },
  { unique: true, name: "uniq_actividades_por_cuenta_cobro" }
);

export const CuentaCobroActividad: Model<ICuentaCobroActividadDocument> =
  mongoose.models.CuentaCobroActividad ??
  mongoose.model<ICuentaCobroActividadDocument>(
    "CuentaCobroActividad",
    cuentaCobroActividadSchema
  );

function toDateIso(value?: Date | null) {
  return value ? value.toISOString() : null;
}

export function toPublicCuentaCobroActividad(
  doc: ICuentaCobroActividadDocument | null
) {
  if (!doc) {
    return {
      id: null,
      actividades: [],
      createdAt: null,
      updatedAt: null,
    };
  }

  return {
    id: String(doc._id),
    userId: String(doc.userId),
    contratoId: String(doc.contratoId),
    cuentaCobroId: String(doc.cuentaCobroId),
    numeroCuenta: doc.numeroCuenta,
    numeroContrato: doc.numeroContrato,
    actividades: doc.actividades
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .map((actividad) => ({
        id: String((actividad as ICuentaCobroActividadItem & { _id?: Types.ObjectId })._id),
        orden: actividad.orden,
        actividad: actividad.actividad,
        accion: actividad.accion,
        soporteTipo: actividad.soporteTipo,
        soporteTexto: actividad.soporteTexto ?? null,
        soporteArchivoPath: actividad.soporteArchivoPath ?? null,
        soporteArchivoNombre: actividad.soporteArchivoNombre ?? null,
        soporteArchivoMimeType: actividad.soporteArchivoMimeType ?? null,
        soporteArchivoSize: actividad.soporteArchivoSize ?? null,
        ejecucion: actividad.ejecucion,
      })),
    createdAt: toDateIso(doc.createdAt),
    updatedAt: toDateIso(doc.updatedAt),
  };
}
