import { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { validateNewContractForUser } from "@/lib/contratos/contractCreationRules.server";
import { enrichContractWithPaymentStats } from "@/lib/contratos/contractStats";
import { generatePaymentAccountsForContract } from "@/lib/contratos/generatePaymentAccounts";
import {
  CUENTA_COBRO_STATUS,
  CuentaCobro,
  toPublicCuentaCobro,
  type CuentaCobroStatus,
} from "@/models/cuentaCobro";
import {
  Contrato,
  getCurrentContractSnapshot,
  toPublicContrato,
  type IContratoDocument,
} from "@/models/contrato";
import { parseDateOnlyToUtcNoon } from "@/utils/date";
import type { CreateContractBodyDto } from "./dto/create-contract.dto";
import type { UpdateContractBodyDto } from "./dto/update-contract.dto";
import { CONTRACT_ERROR_CODES, ContractServiceError } from "./contratos.errors";
import {
  buildContractEditChanges,
  buildContractUpdatePayload,
  hasBlockedFieldChanges,
} from "@/lib/contratos/contractEditDiff";
import { normalizeRubrosAdicionales } from "@/lib/contratos/contractRubrosAdicionales";
import {
  buildManualRegularizationUpdatesForAccounts,
  getManualRegularizationBoundary,
} from "@/lib/contratos/manualRegularization.server";
import {
  parseManualPaymentDatesMap,
  validateManualPaymentDatesForCount,
} from "./dto/manual-payment-dates.dto";
import type { UpdateManualRegularizationBodyDto } from "./dto/update-manual-regularization.dto";

function getContractEndDate(contrato: IContratoDocument) {
  return getCurrentContractSnapshot(contrato).fechaFinal ?? contrato.fechaFinal;
}

async function getPaymentStatsByContractIds(contractIds: Types.ObjectId[]) {
  if (contractIds.length === 0) {
    return new Map<string, { estado: CuentaCobroStatus }[]>();
  }

  const accounts = await CuentaCobro.find({
    contratoId: { $in: contractIds },
  })
    .select("contratoId estado")
    .lean()
    .exec();

  const map = new Map<string, { estado: CuentaCobroStatus }[]>();
  for (const account of accounts) {
    const key = String(account.contratoId);
    const list = map.get(key) ?? [];
    list.push({ estado: account.estado });
    map.set(key, list);
  }
  return map;
}

function resolveCurrentContract(contratos: IContratoDocument[]) {
  const today = new Date();
  return (
    contratos.find((contrato) => {
      const current = getCurrentContractSnapshot(contrato);
      return Boolean(
        current.fechaActaInicio &&
          current.fechaFinal &&
          current.fechaActaInicio <= today &&
          current.fechaFinal >= today
      );
    }) ?? null
  );
}

export const contratosService = {
  async listByUser(userId: string) {
    await connectDB();

    const contratos = await Contrato.find({ userId })
      .sort({ fechaActaInicio: -1, createdAt: -1 })
      .exec();

    const statsMap = await getPaymentStatsByContractIds(
      contratos.map((c) => c._id as Types.ObjectId)
    );

    const contracts = contratos.map((contrato) => {
      const publicContract = toPublicContrato(contrato);
      const stats = statsMap.get(String(contrato._id)) ?? [];
      return enrichContractWithPaymentStats(publicContract, stats);
    });

    const currentContractDoc = resolveCurrentContract(contratos);
    const lastContractDoc =
      currentContractDoc ??
      contratos
        .slice()
        .sort((a, b) => {
          const aEnd = getContractEndDate(a)?.getTime() ?? 0;
          const bEnd = getContractEndDate(b)?.getTime() ?? 0;
          return bEnd - aEnd;
        })[0] ??
      null;

    const currentContract = currentContractDoc
      ? contracts.find((c) => c.id === String(currentContractDoc._id)) ?? null
      : null;

    const lastContract = lastContractDoc
      ? contracts.find((c) => c.id === String(lastContractDoc._id)) ?? null
      : null;

    return {
      contracts,
      currentContract,
      lastContract,
    };
  },

  async create(userId: string, dto: CreateContractBodyDto) {
    await connectDB();

    const fechaActaInicio = parseDateOnlyToUtcNoon(dto.fechaActaInicio);
    const fechaFinal = parseDateOnlyToUtcNoon(dto.fechaFinal);

    if (!fechaActaInicio || !fechaFinal) {
      throw new ContractServiceError(
        "Las fechas del contrato no son válidas",
        400,
        CONTRACT_ERROR_CODES.INVALID_CONTRACT_DATES
      );
    }

    if (fechaFinal < fechaActaInicio) {
      throw new ContractServiceError(
        "La fecha final debe ser posterior a la fecha de acta de inicio",
        400,
        CONTRACT_ERROR_CODES.INVALID_CONTRACT_DATES
      );
    }

    const userContracts = await Contrato.find({ userId }).exec();
    const creationValidation = validateNewContractForUser(
      userContracts,
      fechaActaInicio,
      fechaFinal
    );

    if (!creationValidation.allowed) {
      throw new ContractServiceError(
        creationValidation.message,
        409,
        CONTRACT_ERROR_CODES.ACTIVE_CONTRACT_CONFLICT
      );
    }

    const existing = await Contrato.findOne({
      userId,
      numeroContrato: dto.numeroContrato.trim(),
    }).exec();

    if (existing) {
      throw new ContractServiceError(
        "Ya existe un contrato con este número",
        409,
        CONTRACT_ERROR_CODES.CONTRACT_ALREADY_EXISTS
      );
    }

    const rpc = dto.rpc.trim();

    const contrato = await Contrato.create({
      userId,
      numeroContrato: dto.numeroContrato.trim(),
      objeto: dto.objeto.trim(),
      plazoMeses: dto.plazoMeses,
      fechaActaInicio,
      fechaFinal,
      concepto: dto.concepto.trim(),
      rubro: dto.rubro.trim(),
      cdp: dto.cdp.trim(),
      valorCdp: dto.valorCdp,
      rpc,
      valorRpc: dto.valorRpc,
      valorInicialContrato: dto.valorInicialContrato,
      numeroDisponibilidad: dto.numeroDisponibilidad?.trim() || rpc,
      numeroCompromiso: dto.numeroCompromiso?.trim() || rpc,
      tieneReembolsables: dto.tieneReembolsables ?? false,
      rubroRembolsable: dto.tieneReembolsables
        ? dto.rubroRembolsable?.trim() || undefined
        : undefined,
      conceptoRembolsable: dto.tieneReembolsables
        ? dto.conceptoRembolsable?.trim() || undefined
        : undefined,
      rubrosAdicionales: normalizeRubrosAdicionales(dto.rubrosAdicionales),
      modificaciones: [],
      historialEdiciones: [],
    });

    const generated = await generatePaymentAccountsForContract({
      userId: contrato.userId,
      contratoId: contrato._id as Types.ObjectId,
      fechaActaInicio,
      fechaFinal,
      plazoMeses: dto.plazoMeses,
      valorTotal: dto.valorInicialContrato,
    });

    const regularizedCount = Math.min(
      dto.submittedPaymentAccountsCount ?? 0,
      generated.length
    );

    const manualDatesError = validateManualPaymentDatesForCount(
      regularizedCount,
      dto.manualPaymentDates ?? []
    );
    if (manualDatesError) {
      throw new ContractServiceError(
        manualDatesError,
        400,
        CONTRACT_ERROR_CODES.MANUAL_REGULARIZATION_BLOCKED
      );
    }

    const paymentDatesByNumero = parseManualPaymentDatesMap(
      dto.manualPaymentDates ?? []
    );

    if (regularizedCount > 0) {
      await Promise.all(
        generated.slice(0, regularizedCount).map((account) =>
          CuentaCobro.updateOne(
            { _id: account._id },
            {
              $set: {
                estado: CUENTA_COBRO_STATUS.ENVIADA,
                fechaEnvio: new Date(),
                envioManual: true,
                fechaPago: paymentDatesByNumero.get(account.numero) ?? null,
              },
            }
          )
        )
      );
    }

    const stats = generated.map((a, index) => ({
      estado:
        index < regularizedCount ? CUENTA_COBRO_STATUS.ENVIADA : a.estado,
    }));
    const contract = enrichContractWithPaymentStats(
      toPublicContrato(contrato),
      stats
    );

    return {
      contract,
      paymentAccountsGenerated: generated.length,
      paymentAccountsRegularized: regularizedCount,
    };
  },

  async getByIdForUser(userId: string, contractId: string) {
    await connectDB();

    if (!Types.ObjectId.isValid(contractId)) {
      throw new ContractServiceError(
        "Contrato no encontrado",
        404,
        CONTRACT_ERROR_CODES.CONTRACT_NOT_FOUND
      );
    }

    const contrato = await Contrato.findOne({ _id: contractId, userId }).exec();

    if (!contrato) {
      throw new ContractServiceError(
        "Contrato no encontrado",
        404,
        CONTRACT_ERROR_CODES.CONTRACT_NOT_FOUND
      );
    }

    const cuentasCobro = await CuentaCobro.find({
      userId,
      contratoId: contrato._id,
    })
      .sort({ numero: 1 })
      .exec();

    const contract = enrichContractWithPaymentStats(
      toPublicContrato(contrato),
      cuentasCobro
    );

    return {
      contract,
      paymentAccounts: cuentasCobro.map(toPublicCuentaCobro),
    };
  },

  async update(
    userId: string,
    userName: string,
    contractId: string,
    dto: UpdateContractBodyDto
  ) {
    await connectDB();

    if (!Types.ObjectId.isValid(contractId)) {
      throw new ContractServiceError(
        "Contrato no encontrado",
        404,
        CONTRACT_ERROR_CODES.CONTRACT_NOT_FOUND
      );
    }

    const contrato = await Contrato.findOne({ _id: contractId, userId }).exec();

    if (!contrato) {
      throw new ContractServiceError(
        "Contrato no encontrado",
        404,
        CONTRACT_ERROR_CODES.CONTRACT_NOT_FOUND
      );
    }

    const fechaActaInicio = parseDateOnlyToUtcNoon(dto.fechaActaInicio);
    const fechaFinal = parseDateOnlyToUtcNoon(dto.fechaFinal);

    if (!fechaActaInicio || !fechaFinal) {
      throw new ContractServiceError(
        "Las fechas del contrato no son válidas",
        400,
        CONTRACT_ERROR_CODES.INVALID_CONTRACT_DATES
      );
    }

    if (fechaFinal < fechaActaInicio) {
      throw new ContractServiceError(
        "La fecha final debe ser posterior a la fecha de acta de inicio",
        400,
        CONTRACT_ERROR_CODES.INVALID_CONTRACT_DATES
      );
    }

    const paymentAccountCount = await CuentaCobro.countDocuments({
      contratoId: contrato._id,
    }).exec();

    if (paymentAccountCount > 0 && hasBlockedFieldChanges(contrato, dto)) {
      throw new ContractServiceError(
        "No puedes modificar fechas, plazo o valor inicial porque ya existen cuentas de cobro generadas",
        409,
        CONTRACT_ERROR_CODES.PAYMENT_ACCOUNTS_BLOCK_EDIT
      );
    }

    const trimmedNumero = dto.numeroContrato.trim();
    if (trimmedNumero !== contrato.numeroContrato) {
      const existing = await Contrato.findOne({
        userId,
        numeroContrato: trimmedNumero,
        _id: { $ne: contrato._id },
      }).exec();

      if (existing) {
        throw new ContractServiceError(
          "Ya existe un contrato con este número",
          409,
          CONTRACT_ERROR_CODES.CONTRACT_ALREADY_EXISTS
        );
      }
    }

    const cambios = buildContractEditChanges(contrato, dto);

    if (cambios.length === 0) {
      throw new ContractServiceError(
        "No hay cambios para guardar",
        400,
        CONTRACT_ERROR_CODES.NO_CHANGES
      );
    }

    const updatePayload = buildContractUpdatePayload(dto);
    const historyEntry = {
      fecha: new Date(),
      userId: new Types.ObjectId(userId),
      userName: userName?.trim() || "Usuario",
      cambios,
    };

    await Contrato.updateOne(
      { _id: contrato._id, userId },
      {
        $set: updatePayload,
        $push: { historialEdiciones: historyEntry },
      },
      { runValidators: true }
    );

    const updatedContrato = await Contrato.findById(contrato._id).exec();

    if (!updatedContrato) {
      throw new ContractServiceError(
        "Contrato no encontrado",
        404,
        CONTRACT_ERROR_CODES.CONTRACT_NOT_FOUND
      );
    }

    const cuentasCobro = await CuentaCobro.find({
      userId,
      contratoId: updatedContrato._id,
    })
      .sort({ numero: 1 })
      .exec();

    const contract = enrichContractWithPaymentStats(
      toPublicContrato(updatedContrato),
      cuentasCobro
    );

    return {
      contract,
      paymentAccounts: cuentasCobro.map(toPublicCuentaCobro),
    };
  },

  async updateManualRegularization(
    userId: string,
    contractId: string,
    dto: UpdateManualRegularizationBodyDto
  ) {
    await connectDB();

    if (!Types.ObjectId.isValid(contractId)) {
      throw new ContractServiceError(
        "Contrato no encontrado",
        404,
        CONTRACT_ERROR_CODES.CONTRACT_NOT_FOUND
      );
    }

    const contrato = await Contrato.findOne({ _id: contractId, userId }).exec();

    if (!contrato) {
      throw new ContractServiceError(
        "Contrato no encontrado",
        404,
        CONTRACT_ERROR_CODES.CONTRACT_NOT_FOUND
      );
    }

    const cuentasCobro = await CuentaCobro.find({
      userId,
      contratoId: contrato._id,
    })
      .sort({ numero: 1 })
      .exec();

    const boundary = getManualRegularizationBoundary(cuentasCobro);
    const requestedCount = dto.submittedPaymentAccountsCount;

    if (requestedCount > boundary) {
      throw new ContractServiceError(
        "No puedes marcar más cuentas porque ya hay cuentas enviadas por la app",
        409,
        CONTRACT_ERROR_CODES.MANUAL_REGULARIZATION_BLOCKED
      );
    }

    const manualDatesError = validateManualPaymentDatesForCount(
      requestedCount,
      dto.manualPaymentDates ?? []
    );
    if (manualDatesError) {
      throw new ContractServiceError(
        manualDatesError,
        400,
        CONTRACT_ERROR_CODES.MANUAL_REGULARIZATION_BLOCKED
      );
    }

    const paymentDatesByNumero = parseManualPaymentDatesMap(
      dto.manualPaymentDates ?? []
    );

    const updates = buildManualRegularizationUpdatesForAccounts(
      cuentasCobro,
      requestedCount,
      paymentDatesByNumero
    );

    await Promise.all(
      updates.map((update) =>
        CuentaCobro.updateOne(
          { _id: update.accountId, userId, contratoId: contrato._id },
          { $set: update.set }
        )
      )
    );

    const updatedAccounts = await CuentaCobro.find({
      userId,
      contratoId: contrato._id,
    })
      .sort({ numero: 1 })
      .exec();

    const contract = enrichContractWithPaymentStats(
      toPublicContrato(contrato),
      updatedAccounts
    );

    return {
      contract,
      paymentAccounts: updatedAccounts.map(toPublicCuentaCobro),
    };
  },
};
