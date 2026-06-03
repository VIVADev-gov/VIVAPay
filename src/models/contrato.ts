import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export const CONTRACT_MODIFICATION_TYPES = {
  ADICION: "ADICION",
  PRORROGA: "PRORROGA",
  SUSPENSION: "SUSPENSION",
} as const;

export type ContractModificationType =
  (typeof CONTRACT_MODIFICATION_TYPES)[keyof typeof CONTRACT_MODIFICATION_TYPES];

export interface IContractSnapshot {
  numeroContrato?: string;
  objeto?: string;
  plazoMeses?: number;
  fechaActaInicio?: Date;
  fechaFinal?: Date;
  concepto?: string;
  rubro?: string;
  cdp?: string;
  valorCdp?: number;
  rpc?: string;
  valorRpc?: number;
  valorInicialContrato?: number;
  numeroDisponibilidad?: string;
  numeroCompromiso?: string;
  totalRecursosComprometidos?: number;
}

export interface IContractModification extends IContractSnapshot {
  tipo: ContractModificationType;
  descripcion?: string;
  fechaRegistro?: Date;
}

export interface IContrato extends Required<Omit<IContractSnapshot, "totalRecursosComprometidos">> {
  userId: Types.ObjectId;
  modificaciones: IContractModification[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type IContratoDocument = IContrato & Document;

const contractSnapshotSchema = {
  numeroContrato: { type: String, trim: true },
  objeto: { type: String, trim: true },
  plazoMeses: { type: Number, min: 0 },
  fechaActaInicio: { type: Date },
  fechaFinal: { type: Date },
  concepto: { type: String, trim: true },
  rubro: { type: String, trim: true },
  cdp: { type: String, trim: true },
  valorCdp: { type: Number, min: 0 },
  rpc: { type: String, trim: true },
  valorRpc: { type: Number, min: 0 },
  valorInicialContrato: { type: Number, min: 0 },
  numeroDisponibilidad: { type: String, trim: true },
  numeroCompromiso: { type: String, trim: true },
};

const contractModificationSchema = new Schema<IContractModification>(
  {
    tipo: {
      type: String,
      enum: Object.values(CONTRACT_MODIFICATION_TYPES),
      required: true,
    },
    descripcion: { type: String, trim: true },
    fechaRegistro: { type: Date, default: Date.now },
    ...contractSnapshotSchema,
    totalRecursosComprometidos: { type: Number, min: 0 },
  },
  { _id: true }
);

const contratoSchema = new Schema<IContratoDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    numeroContrato: { type: String, required: true, trim: true, index: true },
    objeto: { type: String, required: true, trim: true },
    plazoMeses: { type: Number, required: true, min: 0 },
    fechaActaInicio: { type: Date, required: true },
    fechaFinal: { type: Date, required: true, index: true },
    concepto: { type: String, required: true, trim: true },
    rubro: { type: String, required: true, trim: true },
    cdp: { type: String, required: true, trim: true },
    valorCdp: { type: Number, required: true, min: 0 },
    rpc: { type: String, required: true, trim: true },
    valorRpc: { type: Number, required: true, min: 0 },
    valorInicialContrato: { type: Number, required: true, min: 0 },
    numeroDisponibilidad: { type: String, required: true, trim: true },
    numeroCompromiso: { type: String, required: true, trim: true },
    modificaciones: { type: [contractModificationSchema], default: [] },
  },
  { timestamps: true, collection: "contratos" }
);

contratoSchema.index({ userId: 1, numeroContrato: 1 }, { unique: true });

export const Contrato: Model<IContratoDocument> =
  mongoose.models.Contrato ??
  mongoose.model<IContratoDocument>("Contrato", contratoSchema);

function toDateIso(value?: Date | null) {
  return value ? value.toISOString() : null;
}

export function getCurrentContractSnapshot(doc: IContratoDocument | IContrato) {
  const base: IContractSnapshot = {
    numeroContrato: doc.numeroContrato,
    objeto: doc.objeto,
    plazoMeses: doc.plazoMeses,
    fechaActaInicio: doc.fechaActaInicio,
    fechaFinal: doc.fechaFinal,
    concepto: doc.concepto,
    rubro: doc.rubro,
    cdp: doc.cdp,
    valorCdp: doc.valorCdp,
    rpc: doc.rpc,
    valorRpc: doc.valorRpc,
    valorInicialContrato: doc.valorInicialContrato,
    numeroDisponibilidad: doc.numeroDisponibilidad,
    numeroCompromiso: doc.numeroCompromiso,
  };

  const current = doc.modificaciones.reduce<IContractSnapshot>(
    (snapshot, modification) => ({
      ...snapshot,
      ...Object.fromEntries(
        Object.entries(modification).filter(
          ([key, value]) =>
            !["_id", "tipo", "descripcion", "fechaRegistro"].includes(key) &&
            value !== undefined &&
            value !== null &&
            value !== ""
        )
      ),
    }),
    base
  );

  return {
    ...current,
    totalRecursosComprometidos:
      current.totalRecursosComprometidos ??
      doc.modificaciones.at(-1)?.totalRecursosComprometidos ??
      current.valorRpc ??
      current.valorInicialContrato ??
      0,
  };
}

export function toPublicContrato(doc: IContratoDocument) {
  const current = getCurrentContractSnapshot(doc);
  const now = new Date();
  const vigente = Boolean(
    current.fechaActaInicio &&
      current.fechaFinal &&
      current.fechaActaInicio <= now &&
      current.fechaFinal >= now
  );

  return {
    id: String(doc._id),
    userId: String(doc.userId),
    numeroContrato: doc.numeroContrato,
    objeto: doc.objeto,
    plazoMeses: doc.plazoMeses,
    fechaActaInicio: toDateIso(doc.fechaActaInicio),
    fechaFinal: toDateIso(doc.fechaFinal),
    concepto: doc.concepto,
    rubro: doc.rubro,
    cdp: doc.cdp,
    valorCdp: doc.valorCdp,
    rpc: doc.rpc,
    valorRpc: doc.valorRpc,
    valorInicialContrato: doc.valorInicialContrato,
    numeroDisponibilidad: doc.numeroDisponibilidad,
    numeroCompromiso: doc.numeroCompromiso,
    modificaciones: doc.modificaciones.map((modification) => ({
      id: String((modification as IContractModification & { _id?: Types.ObjectId })._id),
      tipo: modification.tipo,
      descripcion: modification.descripcion,
      fechaRegistro: toDateIso(modification.fechaRegistro),
      numeroContrato: modification.numeroContrato,
      objeto: modification.objeto,
      plazoMeses: modification.plazoMeses,
      fechaActaInicio: toDateIso(modification.fechaActaInicio),
      fechaFinal: toDateIso(modification.fechaFinal),
      concepto: modification.concepto,
      rubro: modification.rubro,
      cdp: modification.cdp,
      valorCdp: modification.valorCdp,
      rpc: modification.rpc,
      valorRpc: modification.valorRpc,
      valorInicialContrato: modification.valorInicialContrato,
      numeroDisponibilidad: modification.numeroDisponibilidad,
      numeroCompromiso: modification.numeroCompromiso,
      totalRecursosComprometidos: modification.totalRecursosComprometidos,
    })),
    vigente,
    actual: {
      ...current,
      fechaActaInicio: toDateIso(current.fechaActaInicio),
      fechaFinal: toDateIso(current.fechaFinal),
    },
    createdAt: toDateIso(doc.createdAt),
    updatedAt: toDateIso(doc.updatedAt),
  };
}
