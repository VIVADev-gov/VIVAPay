import { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { saveCuentaCobroActividadSoporte } from "@/lib/fileUpload";
import { CuentaCobro } from "@/models/cuentaCobro";
import {
  CUENTA_COBRO_ACTIVIDAD_SOPORTE_TIPO,
  CuentaCobroActividad,
  type CuentaCobroActividadSoporteTipo,
  type ICuentaCobroActividadItem,
  toPublicCuentaCobroActividad,
} from "@/models/cuentaCobroActividad";
import { Contrato, getCurrentContractSnapshot } from "@/models/contrato";
import {
  PAYMENT_ACCOUNT_ERROR_CODES,
  PaymentAccountServiceError,
} from "./cuentas-cobro.errors";

type ActivityPayloadItem = {
  orden: number;
  actividad: string;
  accion: string;
  soporteTipo: CuentaCobroActividadSoporteTipo;
  soporteTexto?: string | null;
  soporteFileKey?: string | null;
  ejecucion: number;
};

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

async function resolveAccountForUser(
  userId: string,
  contractId: string,
  numeroCuenta: number
) {
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

  return { contract, account };
}

function normalizeActivityPayload(value: unknown): ActivityPayloadItem[] {
  if (!Array.isArray(value)) {
    throw new PaymentAccountServiceError("El payload de actividades es inválido", 400);
  }

  return value.map((raw, index) => {
    const item = raw as Partial<ActivityPayloadItem>;
    const orden = Number(item.orden ?? index + 1);
    const ejecucion = Number(item.ejecucion ?? 100);
    const soporteTipo = item.soporteTipo;

    if (!Number.isInteger(orden) || orden < 1) {
      throw new PaymentAccountServiceError("El orden de actividad es inválido", 400);
    }
    if (!item.actividad?.trim()) {
      throw new PaymentAccountServiceError("La actividad es obligatoria", 400);
    }
    if (!item.accion?.trim()) {
      throw new PaymentAccountServiceError("La acción es obligatoria", 400);
    }
    if (!Number.isFinite(ejecucion) || ejecucion < 0 || ejecucion > 100) {
      throw new PaymentAccountServiceError(
        "La ejecución debe estar entre 0 y 100",
        400
      );
    }
    if (
      soporteTipo !== CUENTA_COBRO_ACTIVIDAD_SOPORTE_TIPO.TEXTO &&
      soporteTipo !== CUENTA_COBRO_ACTIVIDAD_SOPORTE_TIPO.ARCHIVO
    ) {
      throw new PaymentAccountServiceError("El tipo de soporte es inválido", 400);
    }
    if (
      soporteTipo === CUENTA_COBRO_ACTIVIDAD_SOPORTE_TIPO.TEXTO &&
      !item.soporteTexto?.trim()
    ) {
      throw new PaymentAccountServiceError("El soporte de texto es obligatorio", 400);
    }

    return {
      orden,
      actividad: item.actividad.trim(),
      accion: item.accion.trim(),
      soporteTipo,
      soporteTexto: item.soporteTexto?.trim() ?? null,
      soporteFileKey: item.soporteFileKey?.trim() ?? null,
      ejecucion,
    };
  });
}

export const cuentasCobroActividadesService = {
  async listActivities(userId: string, contractId: string, numeroCuenta: number) {
    await connectDB();
    const { account } = await resolveAccountForUser(userId, contractId, numeroCuenta);

    const document = await CuentaCobroActividad.findOne({
      userId,
      cuentaCobroId: account._id,
    }).exec();

    return { activities: toPublicCuentaCobroActividad(document) };
  },

  async saveActivities(input: {
    userId: string;
    contractId: string;
    numeroCuenta: number;
    payload: unknown;
    files: FormData;
  }) {
    await connectDB();
    const { contract, account } = await resolveAccountForUser(
      input.userId,
      input.contractId,
      input.numeroCuenta
    );
    const current = getCurrentContractSnapshot(contract);
    const numeroContrato = current.numeroContrato ?? contract.numeroContrato;
    const incoming = normalizeActivityPayload(input.payload);

    const existing = await CuentaCobroActividad.findOne({
      userId: input.userId,
      cuentaCobroId: account._id,
    }).exec();
    const existingByOrden = new Map(
      (existing?.actividades ?? []).map((activity) => [activity.orden, activity])
    );

    const actividades: ICuentaCobroActividadItem[] = [];

    for (const item of incoming) {
      const previous = existingByOrden.get(item.orden);
      let soporteArchivoPath: string | null = null;
      let soporteArchivoNombre: string | null = null;
      let soporteArchivoMimeType: string | null = null;
      let soporteArchivoSize: number | null = null;
      let soporteTexto: string | null = null;

      if (item.soporteTipo === CUENTA_COBRO_ACTIVIDAD_SOPORTE_TIPO.TEXTO) {
        soporteTexto = item.soporteTexto ?? null;
      } else {
        const file = item.soporteFileKey
          ? input.files.get(item.soporteFileKey)
          : null;

        if (file instanceof File) {
          const saved = await saveCuentaCobroActividadSoporte(
            file,
            numeroContrato,
            input.numeroCuenta,
            item.orden
          );
          if (!saved.success || !saved.filePath) {
            throw new PaymentAccountServiceError(
              saved.error ?? "No se pudo guardar el soporte",
              400
            );
          }
          soporteArchivoPath = saved.filePath;
          soporteArchivoNombre = file.name;
          soporteArchivoMimeType = file.type;
          soporteArchivoSize = file.size;
        } else {
          soporteArchivoPath = previous?.soporteArchivoPath ?? null;
          soporteArchivoNombre = previous?.soporteArchivoNombre ?? null;
          soporteArchivoMimeType = previous?.soporteArchivoMimeType ?? null;
          soporteArchivoSize = previous?.soporteArchivoSize ?? null;
        }

        if (!soporteArchivoPath) {
          throw new PaymentAccountServiceError(
            "Debes adjuntar un archivo de soporte",
            400
          );
        }
      }

      actividades.push({
        orden: item.orden,
        actividad: item.actividad,
        accion: item.accion,
        soporteTipo: item.soporteTipo,
        soporteTexto,
        soporteArchivoPath,
        soporteArchivoNombre,
        soporteArchivoMimeType,
        soporteArchivoSize,
        ejecucion: item.ejecucion,
      });
    }

    const document = await CuentaCobroActividad.findOneAndUpdate(
      {
        userId: input.userId,
        cuentaCobroId: account._id,
      },
      {
        userId: input.userId,
        contratoId: contract._id,
        cuentaCobroId: account._id,
        numeroCuenta: input.numeroCuenta,
        numeroContrato,
        actividades: actividades.sort((a, b) => a.orden - b.orden),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();

    return { activities: toPublicCuentaCobroActividad(document) };
  },
};
