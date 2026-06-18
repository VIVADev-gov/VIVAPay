import {
  derivePeriodoCorte,
  type PaymentAccountReembolsables,
} from "@/lib/cuentas-cobro/paymentAccountReembolsables";
import type { FormPackageContext } from "@/lib/forms/excel/types";

function formatDocDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CO");
}

function formatPeriodoComision(
  periodoInicio: Date | null,
  periodoFin: Date | null,
  periodoCorte: "1/15" | "16/30"
) {
  const inicio = periodoInicio ? formatDocDate(periodoInicio.toISOString()) : "";
  const fin = periodoFin ? formatDocDate(periodoFin.toISOString()) : "";
  const rango = inicio && fin ? `${inicio} – ${fin}` : inicio || fin;
  return rango ? `${periodoCorte} (${rango})` : periodoCorte;
}

export function buildGthFo52DocxData(
  ctx: FormPackageContext,
  reembolsables: PaymentAccountReembolsables
): Record<string, unknown> {
  const { contract, contractor, paymentAccount } = ctx;
  const periodoCorte = derivePeriodoCorte(
    paymentAccount.periodoInicio?.toISOString() ?? null
  );

  return {
    contratistaNombre: contractor.name.toUpperCase(),
    cargo: "CONTRATISTA",
    fechaComision: formatDocDate(
      paymentAccount.enviadaCadAt?.toISOString() ??
        new Date().toISOString()
    ),
    periodoComision: formatPeriodoComision(
      paymentAccount.periodoInicio,
      paymentAccount.periodoFin,
      periodoCorte
    ),
    numeroContrato: contract.numeroContrato,
    cumplimientoObjetivos: reembolsables.cumplimientoObjetivos ?? "",
    observaciones: reembolsables.observaciones ?? "",
    encargos: reembolsables.encargos.map((encargo) => ({
      id: encargo.id,
      numeroContrato: contract.numeroContrato,
      destino: encargo.municipioNombre,
      otrosDestinos: encargo.otrosDestinos ?? "",
      zona: encargo.subregionNombre,
      fechaSalida: formatDocDate(encargo.fechaSalida),
      fechaRegreso: formatDocDate(encargo.fechaRegreso),
      pernocta: encargo.pernocta ? "Si" : "No",
      tipoTransporte: encargo.tipoTransporte,
      novedad: "Ninguna",
      cumplida: "Si",
    })),
  };
}
