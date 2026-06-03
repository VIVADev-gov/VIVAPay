import { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { enrichContractWithPaymentStats } from "@/lib/contratos/contractStats";
import { generatePaymentAccountsForContract } from "@/lib/contratos/generatePaymentAccounts";
import { CuentaCobro, toPublicCuentaCobro } from "@/models/cuentaCobro";
import {
  Contrato,
  getCurrentContractSnapshot,
  toPublicContrato,
  type IContratoDocument,
} from "@/models/contrato";
import type { CreateContractBodyDto } from "./dto/create-contract.dto";
import { CONTRACT_ERROR_CODES, ContractServiceError } from "./contratos.errors";

function getContractEndDate(contrato: IContratoDocument) {
  return getCurrentContractSnapshot(contrato).fechaFinal ?? contrato.fechaFinal;
}

async function getPaymentStatsByContractIds(contractIds: Types.ObjectId[]) {
  if (contractIds.length === 0) return new Map<string, { estado: string }[]>();

  const accounts = await CuentaCobro.find({
    contratoId: { $in: contractIds },
  })
    .select("contratoId estado")
    .lean()
    .exec();

  const map = new Map<string, { estado: string }[]>();
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

    const fechaActaInicio = new Date(dto.fechaActaInicio);
    const fechaFinal = new Date(dto.fechaFinal);

    if (fechaFinal < fechaActaInicio) {
      throw new ContractServiceError(
        "La fecha final debe ser posterior a la fecha de acta de inicio",
        400,
        CONTRACT_ERROR_CODES.INVALID_CONTRACT_DATES
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
      rpc: dto.rpc.trim(),
      valorRpc: dto.valorRpc,
      valorInicialContrato: dto.valorInicialContrato,
      numeroDisponibilidad: dto.numeroDisponibilidad.trim(),
      numeroCompromiso: dto.numeroCompromiso.trim(),
      modificaciones: [],
    });

    const generated = await generatePaymentAccountsForContract({
      userId: contrato.userId,
      contratoId: contrato._id as Types.ObjectId,
      fechaActaInicio,
      fechaFinal,
      plazoMeses: dto.plazoMeses,
      valorTotal: dto.valorInicialContrato,
    });

    const stats = generated.map((a) => ({ estado: a.estado }));
    const contract = enrichContractWithPaymentStats(
      toPublicContrato(contrato),
      stats
    );

    return {
      contract,
      paymentAccountsGenerated: generated.length,
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
};
