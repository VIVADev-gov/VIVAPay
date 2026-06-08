import { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import {
  saveContratoDocumento,
  saveCuentaCobroContratoDocumento,
} from "@/lib/fileUpload";
import { CuentaCobro } from "@/models/cuentaCobro";
import {
  CUENTA_COBRO_DOCUMENT_SCOPE,
  CuentaCobroDocumento,
  toPublicCuentaCobroDocumento,
} from "@/models/cuentaCobroDocumento";
import { Contrato, getCurrentContractSnapshot } from "@/models/contrato";
import {
  buildPlantillaMetadata,
  SEGURIDAD_SOCIAL_TIPO,
  type SeguridadSocialPlantillaMetadata,
} from "@/lib/cuentas-cobro/seguridadSocialPlantilla";
import {
  PAYMENT_ACCOUNT_ERROR_CODES,
  PaymentAccountServiceError,
} from "./cuentas-cobro.errors";

type UploadDocumentInput = {
  userId: string;
  contractId: string;
  file?: File | null;
  tipoDocumento: string;
  required?: boolean;
  plantillaMetadata?: SeguridadSocialPlantillaMetadata | null;
};

type UploadAccountDocumentInput = UploadDocumentInput & {
  numeroCuenta: number;
};

function normalizeTipoDocumento(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9_ -]/g, "_");
}

function resolveDocumentMetadata(
  tipoDocumento: string,
  plantillaMetadata?: SeguridadSocialPlantillaMetadata | null
) {
  if (tipoDocumento !== SEGURIDAD_SOCIAL_TIPO) {
    return null;
  }

  if (!plantillaMetadata) {
    throw new PaymentAccountServiceError(
      "Debes indicar los números de plantilla de seguridad social",
      400
    );
  }

  return plantillaMetadata;
}

export function parsePlantillaMetadataFromFormData(formData: FormData) {
  const modo = String(formData.get("plantillaModo") ?? "UNICO").trim();
  const plantillaModo = modo === "SEPARADO" ? "SEPARADO" : "UNICO";

  const { metadata, error } = buildPlantillaMetadata({
    modo: plantillaModo,
    plantillaUnica: String(formData.get("plantillaUnica") ?? ""),
    plantillaPension: String(formData.get("plantillaPension") ?? ""),
    plantillaEps: String(formData.get("plantillaEps") ?? ""),
    plantillaArl: String(formData.get("plantillaArl") ?? ""),
  });

  if (error || !metadata) {
    throw new PaymentAccountServiceError(error ?? "Datos de plantilla inválidos", 400);
  }

  return metadata;
}

async function resolveContractForUser(userId: string, contractId: string) {
  if (!Types.ObjectId.isValid(contractId)) {
    throw new PaymentAccountServiceError(
      "Contrato no encontrado",
      404,
      PAYMENT_ACCOUNT_ERROR_CODES.CONTRACT_NOT_FOUND
    );
  }

  const contract = await Contrato.findOne({ _id: contractId, userId }).exec();
  if (!contract) {
    throw new PaymentAccountServiceError(
      "Contrato no encontrado",
      404,
      PAYMENT_ACCOUNT_ERROR_CODES.CONTRACT_NOT_FOUND
    );
  }

  return contract;
}

export const cuentasCobroDocumentosService = {
  async listContractDocuments(userId: string, contractId: string) {
    await connectDB();
    const contract = await resolveContractForUser(userId, contractId);

    const documents = await CuentaCobroDocumento.find({
      userId,
      contratoId: contract._id,
      scope: CUENTA_COBRO_DOCUMENT_SCOPE.CONTRATO,
    })
      .sort({ tipoDocumento: 1 })
      .exec();

    return {
      documents: documents.map(toPublicCuentaCobroDocumento),
    };
  },

  async listAccountDocuments(
    userId: string,
    contractId: string,
    numeroCuenta: number
  ) {
    await connectDB();
    const contract = await resolveContractForUser(userId, contractId);

    const account = await CuentaCobro.findOne({
      userId,
      contratoId: contract._id,
      numero: numeroCuenta,
    }).exec();

    if (!account) {
      throw new PaymentAccountServiceError(
        "Cuenta de cobro no encontrada",
        404,
        PAYMENT_ACCOUNT_ERROR_CODES.CONTRACT_NOT_FOUND
      );
    }

    const [contractDocuments, accountDocuments] = await Promise.all([
      CuentaCobroDocumento.find({
        userId,
        contratoId: contract._id,
        scope: CUENTA_COBRO_DOCUMENT_SCOPE.CONTRATO,
      })
        .sort({ tipoDocumento: 1 })
        .exec(),
      CuentaCobroDocumento.find({
        userId,
        contratoId: contract._id,
        cuentaCobroId: account._id,
        numeroCuenta,
        scope: CUENTA_COBRO_DOCUMENT_SCOPE.CUENTA_COBRO,
      })
        .sort({ tipoDocumento: 1 })
        .exec(),
    ]);

    return {
      contractDocuments: contractDocuments.map(toPublicCuentaCobroDocumento),
      accountDocuments: accountDocuments.map(toPublicCuentaCobroDocumento),
    };
  },

  async uploadContractDocument(input: UploadDocumentInput) {
    await connectDB();
    const contract = await resolveContractForUser(input.userId, input.contractId);
    const current = getCurrentContractSnapshot(contract);
    const numeroContrato = current.numeroContrato ?? contract.numeroContrato;
    const tipoDocumento = normalizeTipoDocumento(input.tipoDocumento);

    const saved = await saveContratoDocumento(
      input.file,
      numeroContrato,
      tipoDocumento
    );
    if (!saved.success || !saved.filePath) {
      throw new PaymentAccountServiceError(
        saved.error ?? "No se pudo guardar el documento",
        400
      );
    }

    const document = await CuentaCobroDocumento.findOneAndUpdate(
      {
        contratoId: contract._id,
        scope: CUENTA_COBRO_DOCUMENT_SCOPE.CONTRATO,
        tipoDocumento,
      },
      {
        userId: input.userId,
        contratoId: contract._id,
        cuentaCobroId: null,
        numeroCuenta: null,
        numeroContrato,
        tipoDocumento,
        scope: CUENTA_COBRO_DOCUMENT_SCOPE.CONTRATO,
        filePath: saved.filePath,
        originalName: input.file.name,
        size: input.file.size,
        mimeType: input.file.type,
        required: input.required ?? false,
        generated: false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();

    return { document: toPublicCuentaCobroDocumento(document) };
  },

  async uploadAccountDocument(input: UploadAccountDocumentInput) {
    await connectDB();
    const contract = await resolveContractForUser(input.userId, input.contractId);
    const account = await CuentaCobro.findOne({
      userId: input.userId,
      contratoId: contract._id,
      numero: input.numeroCuenta,
    }).exec();

    if (!account) {
      throw new PaymentAccountServiceError(
        "Cuenta de cobro no encontrada",
        404,
        PAYMENT_ACCOUNT_ERROR_CODES.CONTRACT_NOT_FOUND
      );
    }

    const current = getCurrentContractSnapshot(contract);
    const numeroContrato = current.numeroContrato ?? contract.numeroContrato;
    const tipoDocumento = normalizeTipoDocumento(input.tipoDocumento);
    const metadata = resolveDocumentMetadata(tipoDocumento, input.plantillaMetadata);

    const existingDocument = await CuentaCobroDocumento.findOne({
      contratoId: contract._id,
      scope: CUENTA_COBRO_DOCUMENT_SCOPE.CUENTA_COBRO,
      tipoDocumento,
      numeroCuenta: input.numeroCuenta,
    }).exec();

    if (!input.file) {
      if (!existingDocument) {
        throw new PaymentAccountServiceError(
          "Debes adjuntar un archivo PDF",
          400
        );
      }

      const document = await CuentaCobroDocumento.findOneAndUpdate(
        { _id: existingDocument._id },
        {
          metadata,
          required: input.required ?? existingDocument.required ?? false,
        },
        { new: true }
      ).exec();

      if (!document) {
        throw new PaymentAccountServiceError(
          "No se pudo actualizar el documento",
          500
        );
      }

      return { document: toPublicCuentaCobroDocumento(document) };
    }

    const saved = await saveCuentaCobroContratoDocumento(
      input.file,
      numeroContrato,
      input.numeroCuenta,
      tipoDocumento
    );
    if (!saved.success || !saved.filePath) {
      throw new PaymentAccountServiceError(
        saved.error ?? "No se pudo guardar el documento",
        400
      );
    }

    const document = await CuentaCobroDocumento.findOneAndUpdate(
      {
        contratoId: contract._id,
        scope: CUENTA_COBRO_DOCUMENT_SCOPE.CUENTA_COBRO,
        tipoDocumento,
        numeroCuenta: input.numeroCuenta,
      },
      {
        userId: input.userId,
        contratoId: contract._id,
        cuentaCobroId: account._id,
        numeroCuenta: input.numeroCuenta,
        numeroContrato,
        tipoDocumento,
        scope: CUENTA_COBRO_DOCUMENT_SCOPE.CUENTA_COBRO,
        filePath: saved.filePath,
        originalName: input.file.name,
        size: input.file.size,
        mimeType: input.file.type,
        required: input.required ?? false,
        generated: false,
        metadata,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();

    return { document: toPublicCuentaCobroDocumento(document) };
  },
};
