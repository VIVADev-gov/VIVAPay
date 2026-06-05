import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export const CUENTA_COBRO_DOCUMENT_SCOPE = {
  CONTRATO: "CONTRATO",
  CUENTA_COBRO: "CUENTA_COBRO",
} as const;

export type CuentaCobroDocumentScope =
  (typeof CUENTA_COBRO_DOCUMENT_SCOPE)[keyof typeof CUENTA_COBRO_DOCUMENT_SCOPE];

export interface ICuentaCobroDocumento {
  userId: Types.ObjectId;
  contratoId: Types.ObjectId;
  cuentaCobroId?: Types.ObjectId | null;
  numeroCuenta?: number | null;
  numeroContrato: string;
  tipoDocumento: string;
  scope: CuentaCobroDocumentScope;
  filePath: string;
  originalName?: string;
  size?: number;
  mimeType?: string;
  required?: boolean;
  generated?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ICuentaCobroDocumentoDocument = ICuentaCobroDocumento & Document;

const cuentaCobroDocumentoSchema = new Schema<ICuentaCobroDocumentoDocument>(
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
      default: null,
      index: true,
    },
    numeroCuenta: { type: Number, default: null, min: 1, index: true },
    numeroContrato: { type: String, required: true, trim: true, index: true },
    tipoDocumento: { type: String, required: true, trim: true },
    scope: {
      type: String,
      enum: Object.values(CUENTA_COBRO_DOCUMENT_SCOPE),
      required: true,
      index: true,
    },
    filePath: { type: String, required: true, trim: true },
    originalName: { type: String, trim: true },
    size: { type: Number, min: 0 },
    mimeType: { type: String, trim: true },
    required: { type: Boolean, default: false },
    generated: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "cuentas_cobro_documentos" }
);

cuentaCobroDocumentoSchema.index(
  { contratoId: 1, scope: 1, tipoDocumento: 1 },
  {
    name: "uniq_cuenta_cobro_documento_contrato",
    unique: true,
    partialFilterExpression: {
      scope: CUENTA_COBRO_DOCUMENT_SCOPE.CONTRATO,
    },
  }
);

cuentaCobroDocumentoSchema.index(
  { cuentaCobroId: 1, scope: 1, tipoDocumento: 1 },
  {
    name: "uniq_cuenta_cobro_documento_cuenta",
    unique: true,
    partialFilterExpression: {
      scope: CUENTA_COBRO_DOCUMENT_SCOPE.CUENTA_COBRO,
      cuentaCobroId: { $type: "objectId" },
    },
  }
);

export const CuentaCobroDocumento: Model<ICuentaCobroDocumentoDocument> =
  mongoose.models.CuentaCobroDocumento ??
  mongoose.model<ICuentaCobroDocumentoDocument>(
    "CuentaCobroDocumento",
    cuentaCobroDocumentoSchema
  );

function toDateIso(value?: Date | null) {
  return value ? value.toISOString() : null;
}

export function toPublicCuentaCobroDocumento(
  doc: ICuentaCobroDocumentoDocument
) {
  return {
    id: String(doc._id),
    userId: String(doc.userId),
    contratoId: String(doc.contratoId),
    cuentaCobroId: doc.cuentaCobroId ? String(doc.cuentaCobroId) : null,
    numeroCuenta: doc.numeroCuenta ?? null,
    numeroContrato: doc.numeroContrato,
    tipoDocumento: doc.tipoDocumento,
    scope: doc.scope,
    filePath: doc.filePath,
    originalName: doc.originalName ?? null,
    size: doc.size ?? null,
    mimeType: doc.mimeType ?? null,
    required: doc.required ?? false,
    generated: doc.generated ?? false,
    createdAt: toDateIso(doc.createdAt),
    updatedAt: toDateIso(doc.updatedAt),
  };
}
