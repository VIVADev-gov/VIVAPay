import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import type { UserRole } from "@/constants/userRoles";

export const CUENTA_COBRO_STATUS = {
  BORRADOR: "BORRADOR",
  PENDIENTE: "PENDIENTE",
  HABILITADA: "HABILITADA",
  PENDIENTE_CONTRATISTA: "PENDIENTE_CONTRATISTA",
  ENVIADA_CONTRATISTA: "ENVIADA_CONTRATISTA",
  PENDIENTE_SUPERVISOR: "PENDIENTE_SUPERVISOR",
  PENDIENTE_DIRECTOR: "PENDIENTE_DIRECTOR",
  PENDIENTE_ENVIO_CAD: "PENDIENTE_ENVIO_CAD",
  PENDIENTE_JEFE: "PENDIENTE_JEFE",
  ENVIADA: "ENVIADA",
  ENVIADA_CAD: "ENVIADA_CAD",
  APROBADA: "APROBADA",
  RECHAZADA: "RECHAZADA",
} as const;

export type CuentaCobroStatus =
  (typeof CUENTA_COBRO_STATUS)[keyof typeof CUENTA_COBRO_STATUS];

export type ICuentaCobroDeclaracionesJuradas = {
  contratoMultiplesTrabajadores: boolean;
  rutActualizado: boolean;
};

export type ICuentaCobroDevolucion = {
  deRol: UserRole;
  deUserId: Types.ObjectId;
  mensaje: string;
  fecha: Date;
  estadoAnterior: CuentaCobroStatus;
  estadoNuevo: CuentaCobroStatus;
};

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
  declaracionesJuradas?: ICuentaCobroDeclaracionesJuradas | null;
  directorFirmadoAt?: Date | null;
  directorFirmadoPor?: Types.ObjectId | null;
  jefeFirmadoAt?: Date | null;
  jefeFirmadoPor?: Types.ObjectId | null;
  enviadaCadAt?: Date | null;
  enviadaCadPor?: Types.ObjectId | null;
  devoluciones?: ICuentaCobroDevolucion[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type ICuentaCobroDocument = ICuentaCobro & Document;

const devolucionSchema = new Schema<ICuentaCobroDevolucion>(
  {
    deRol: { type: String, required: true },
    deUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mensaje: { type: String, required: true, trim: true },
    fecha: { type: Date, required: true },
    estadoAnterior: { type: String, required: true },
    estadoNuevo: { type: String, required: true },
  },
  { _id: true }
);

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
    declaracionesJuradas: {
      contratoMultiplesTrabajadores: { type: Boolean },
      rutActualizado: { type: Boolean },
    },
    directorFirmadoAt: { type: Date, default: null },
    directorFirmadoPor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    jefeFirmadoAt: { type: Date, default: null },
    jefeFirmadoPor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    enviadaCadAt: { type: Date, default: null },
    enviadaCadPor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    devoluciones: { type: [devolucionSchema], default: [] },
  },
  { timestamps: true, collection: "cuentas_cobro" }
);

cuentaCobroSchema.index({ contratoId: 1, numero: 1 }, { unique: true });

if (mongoose.models.CuentaCobro) {
  delete mongoose.models.CuentaCobro;
}

export const CuentaCobro: Model<ICuentaCobroDocument> =
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
    directorFirmadoAt: toDateIso(doc.directorFirmadoAt),
    directorFirmadoPor: doc.directorFirmadoPor
      ? String(doc.directorFirmadoPor)
      : null,
    jefeFirmadoAt: toDateIso(doc.jefeFirmadoAt),
    jefeFirmadoPor: doc.jefeFirmadoPor ? String(doc.jefeFirmadoPor) : null,
    enviadaCadAt: toDateIso(doc.enviadaCadAt),
    enviadaCadPor: doc.enviadaCadPor ? String(doc.enviadaCadPor) : null,
    devoluciones: (doc.devoluciones ?? []).map((item, index) => ({
      id: String((item as { _id?: Types.ObjectId })._id ?? index),
      deRol: item.deRol,
      deUserId: String(item.deUserId),
      mensaje: item.mensaje,
      fecha: toDateIso(item.fecha),
      estadoAnterior: item.estadoAnterior,
      estadoNuevo: item.estadoNuevo,
    })),
    createdAt: toDateIso(doc.createdAt),
    updatedAt: toDateIso(doc.updatedAt),
  };
}
