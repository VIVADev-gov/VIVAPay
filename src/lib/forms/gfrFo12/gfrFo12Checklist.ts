import {
  includesGfrFo11,
  type PaymentPhase,
  resolvePaymentPhase,
} from "@/lib/cuentas-cobro/paymentAccountRules";
import { parseGfrFo11Responses } from "@/lib/cuentas-cobro/gfrFo11Responses";
import { isReembolsablesComplete } from "@/lib/cuentas-cobro/paymentAccountReembolsables";
import type { FormPackageContext } from "@/lib/forms/excel/types";
import type { PublicCuentaCobro } from "@/types/contratos";

export type GfrFo12RowCode =
  | "GFR_FO_12"
  | "GFR_FO_17"
  | "SEGURIDAD_SOCIAL"
  | "GTH_FO_52"
  | "RUT"
  | "FACTURA"
  | "CONTRATO"
  | "ACTA_INICIO"
  | "POLIZA_FIRMADA"
  | "CERTIFICADO_APROBACION_POLIZA"
  | "CARTA_CUENTA_AFC"
  | "CERTIFICACION_BANCARIA"
  | "GFR_FO_11"
  | "GFR_FO_10"
  | "GBS_FO_40"
  | "GFR_FO_16"
  | "GTH_FO_17"
  | "GBS_FO_05";

export type GfrFo12RowDef = {
  numero: number;
  code: GfrFo12RowCode;
  descripcion: string;
  pago1: string;
  pago2: string;
  pagoUltimo: string;
  pagoUnico: string;
  nota: string;
  blockIfMissing: boolean;
};

export type GfrFo12RowData = GfrFo12RowDef & {
  entrega: "SI" | "NO";
};

export type GfrFo12DocumentTypes = {
  contractTypes: Set<string>;
  accountTypes: Set<string>;
};

const PHASE_LABELS: Record<PaymentPhase, string> = {
  PRIMERA: "primera",
  INTERMEDIA: "intermedia",
  ULTIMA: "última",
  UNICA: "única",
};

const PHASE_COLUMN: Record<
  PaymentPhase,
  keyof Pick<GfrFo12RowDef, "pago1" | "pago2" | "pagoUltimo" | "pagoUnico">
> = {
  PRIMERA: "pago1",
  INTERMEDIA: "pago2",
  ULTIMA: "pagoUltimo",
  UNICA: "pagoUnico",
};

export const GFR_FO_12_ROWS: GfrFo12RowDef[] = [
  {
    numero: 1,
    code: "GFR_FO_12",
    descripcion:
      "GFR-FO-12 Lista de verificación de documentos para pagos a prestadores de servicios.",
    pago1: "X",
    pago2: "X",
    pagoUltimo: "X",
    pagoUnico: "X",
    nota: "",
    blockIfMissing: true,
  },
  {
    numero: 2,
    code: "GFR_FO_17",
    descripcion:
      "GFR-FO-17 Informe de ejecución contractual prestadores de servicios personales.",
    pago1: "X",
    pago2: "X",
    pagoUltimo: "X",
    pagoUnico: "X",
    nota: "",
    blockIfMissing: true,
  },
  {
    numero: 3,
    code: "SEGURIDAD_SOCIAL",
    descripcion:
      "Soporte de cumplimiento de obligación de pago de Seguridad Social.",
    pago1: "X",
    pago2: "X",
    pagoUltimo: "X",
    pagoUnico: "X",
    nota: "Persona natural: Soportes de pago seguridad social del mes correspondiente al cobro.  Persona jurídica: Certificación paz y salvo de seguridad social.",
    blockIfMissing: true,
  },
  {
    numero: 4,
    code: "GTH_FO_52",
    descripcion:
      "GTH-FO-51 Cumplido de Comisión de viaje GTH-FO-52 Encargo de comisión de viaje. Si aplica",
    pago1: "X",
    pago2: "X",
    pagoUltimo: "X",
    pagoUnico: "X",
    nota: "",
    blockIfMissing: true,
  },
  {
    numero: 5,
    code: "RUT",
    descripcion: "Copia de RUT debidamente firmado.",
    pago1: "X",
    pago2: "",
    pagoUltimo: "",
    pagoUnico: "X",
    nota: "Adicionalmente, cuando se haya actualizado por cambios de requerimiento legal o información general del contribuyente.",
    blockIfMissing: true,
  },
  {
    numero: 6,
    code: "FACTURA",
    descripcion: "Factura electrónica de venta",
    pago1: "x",
    pago2: "x",
    pagoUltimo: "x",
    pagoUnico: "",
    nota: "Recuerda tener presente que la factura electrónica, es solo si se tienen la responsabilidad de facturador electrónico en el rut.",
    blockIfMissing: false,
  },
  {
    numero: 7,
    code: "CONTRATO",
    descripcion: "Contrato",
    pago1: "X",
    pago2: "",
    pagoUltimo: "",
    pagoUnico: "X",
    nota: "Adicionalmente, cuando se realice modificación, se adjunta a la cuenta subsiguiente.",
    blockIfMissing: true,
  },
  {
    numero: 8,
    code: "ACTA_INICIO",
    descripcion: "Acta de inicio",
    pago1: "X",
    pago2: "",
    pagoUltimo: "",
    pagoUnico: "X",
    nota: "",
    blockIfMissing: true,
  },
  {
    numero: 9,
    code: "POLIZA_FIRMADA",
    descripcion: "Póliza firmada",
    pago1: "X",
    pago2: "",
    pagoUltimo: "",
    pagoUnico: "X",
    nota: "Adicionalmente, cuando se realice modificación de prórroga o adición, se adjunta a la cuenta subsiguiente.",
    blockIfMissing: true,
  },
  {
    numero: 10,
    code: "CERTIFICADO_APROBACION_POLIZA",
    descripcion: "Certificado de aprobación de Póliza",
    pago1: "X",
    pago2: "",
    pagoUltimo: "",
    pagoUnico: "X",
    nota: "Adicionalmente, cuando se realice modificación de prórroga o adición, se adjunta a la cuenta subsiguiente.",
    blockIfMissing: true,
  },
  {
    numero: 11,
    code: "CARTA_CUENTA_AFC",
    descripcion: "Carta de cuenta AFC (opcional)",
    pago1: "X",
    pago2: "X",
    pagoUltimo: "X",
    pagoUnico: "X",
    nota: "",
    blockIfMissing: false,
  },
  {
    numero: 12,
    code: "CERTIFICACION_BANCARIA",
    descripcion: "Certificación Bancaria",
    pago1: "X",
    pago2: "",
    pagoUltimo: "",
    pagoUnico: "X",
    nota: "Adicionalmente, cuando se solicita cambio de cuenta para realizar pago.",
    blockIfMissing: true,
  },
  {
    numero: 13,
    code: "GFR_FO_11",
    descripcion: "GFR-FO-11 Certificado responsable de IVA.",
    pago1: "X",
    pago2: "",
    pagoUltimo: "",
    pagoUnico: "X",
    nota: "Adicionalmente, cuando cambie calidad de no responsable a responsable de IVA",
    blockIfMissing: true,
  },
  {
    numero: 14,
    code: "GFR_FO_10",
    descripcion:
      "GFR-FO-10 Disminución Base de Retención en la Fuente (Si aplica)",
    pago1: "X",
    pago2: "",
    pagoUltimo: "",
    pagoUnico: "X",
    nota: "Adicionalmente, al inicio de año antes de finalizar el primer trimestre de año.",
    blockIfMissing: false,
  },
  {
    numero: 15,
    code: "GBS_FO_40",
    descripcion:
      "GBS-FO-40 Acta de Recibo Final (Prestación de Servicios)",
    pago1: "",
    pago2: "",
    pagoUltimo: "X",
    pagoUnico: "X",
    nota: "Una vez revisada y firmada el acta de cierre y/o liquidación, se deberá enviar al área de presupuesto para liberar los recursos apropiados y no ejecutados que se encuentren en el Registro Presupuestal y que estén relacionados en el cuadro de cierre financiero.",
    blockIfMissing: true,
  },
  {
    numero: 16,
    code: "GFR_FO_16",
    descripcion: "GFR-FO-16 Autorización de pago ordenador del gasto",
    pago1: "X",
    pago2: "X",
    pagoUltimo: "X",
    pagoUnico: "X",
    nota: "",
    blockIfMissing: true,
  },
  {
    numero: 17,
    code: "GTH_FO_17",
    descripcion: "GTH-FO-17 Paz y Salvo",
    pago1: "",
    pago2: "",
    pagoUltimo: "X",
    pagoUnico: "X",
    nota: "Talento Humano confirma a Gestión Financiera y Prestador de Servicios si se debe adjuntar.",
    blockIfMissing: true,
  },
  {
    numero: 18,
    code: "GBS_FO_05",
    descripcion: "GBS-FO-05 Evaluación de Proveedores",
    pago1: "",
    pago2: "",
    pagoUltimo: "X",
    pagoUnico: "X",
    nota: "",
    blockIfMissing: true,
  },
];

function hasPhaseMark(value: string) {
  return value.trim().toUpperCase() === "X";
}

export function rowAppliesToPhase(row: GfrFo12RowDef, phase: PaymentPhase) {
  return hasPhaseMark(row[PHASE_COLUMN[phase]]);
}

function hasUploadedType(
  code: GfrFo12RowCode,
  uploaded: GfrFo12DocumentTypes
) {
  const contractCodes = new Set([
    "RUT",
    "CONTRATO",
    "ACTA_INICIO",
    "POLIZA_FIRMADA",
    "CERTIFICADO_APROBACION_POLIZA",
    "CERTIFICACION_BANCARIA",
  ]);
  if (contractCodes.has(code)) {
    return uploaded.contractTypes.has(code);
  }
  if (code === "SEGURIDAD_SOCIAL") {
    return uploaded.accountTypes.has("SEGURIDAD_SOCIAL");
  }
  if (
    code === "CARTA_CUENTA_AFC" ||
    code === "GBS_FO_40" ||
    code === "GTH_FO_17" ||
    code === "GBS_FO_05"
  ) {
    return uploaded.accountTypes.has(code);
  }
  return false;
}

export function resolveGfrFo12Entrega(
  row: GfrFo12RowDef,
  ctx: FormPackageContext,
  uploaded: GfrFo12DocumentTypes
): "SI" | "NO" {
  const phase = resolvePaymentPhase(
    { numero: ctx.paymentAccount.numero } as PublicCuentaCobro,
    ctx.paymentAccounts.map(
      (account) => ({ numero: account.numero }) as PublicCuentaCobro
    )
  );

  // La columna ENTREGA solo aplica a documentos que corresponden a la fase
  // actual (según las columnas pago1/pago2/pagoUltimo/pagoUnico). Sin esto, los
  // documentos de contrato reutilizables se marcaban como "SI" en cuentas
  // intermedias/última aunque no se adjuntan en ese pago.
  if (!rowAppliesToPhase(row, phase)) return "NO";

  switch (row.code) {
    case "GFR_FO_12":
    case "GFR_FO_17":
    case "GFR_FO_16":
      return "SI";
    case "GTH_FO_52":
      if (!ctx.contract.tieneReembolsables) return "NO";
      return isReembolsablesComplete(ctx.paymentAccount.reembolsables)
        ? "SI"
        : "NO";
    case "GFR_FO_11":
      if (!includesGfrFo11(phase)) return "NO";
      return parseGfrFo11Responses(ctx.paymentAccount.gfrFo11) ? "SI" : "NO";
    case "FACTURA":
    case "GFR_FO_10":
      return "NO";
    default:
      return hasUploadedType(row.code, uploaded) ? "SI" : "NO";
  }
}

export function buildGfrFo12ChecklistRows(
  ctx: FormPackageContext,
  uploaded: GfrFo12DocumentTypes
): GfrFo12RowData[] {
  return GFR_FO_12_ROWS.map((row) => ({
    ...row,
    entrega: resolveGfrFo12Entrega(row, ctx, uploaded),
  }));
}

export function validateGfrFo12ForPhase(
  ctx: FormPackageContext,
  uploaded: GfrFo12DocumentTypes
): string | null {
  const phase = resolvePaymentPhase(
    { numero: ctx.paymentAccount.numero } as PublicCuentaCobro,
    ctx.paymentAccounts.map(
      (account) => ({ numero: account.numero }) as PublicCuentaCobro
    )
  );
  const rows = buildGfrFo12ChecklistRows(ctx, uploaded);

  for (const row of rows) {
    if (!rowAppliesToPhase(row, phase)) continue;
    if (!row.blockIfMissing) continue;
    if (row.code === "GTH_FO_52" && !ctx.contract.tieneReembolsables) continue;
    if (row.entrega === "SI") continue;
    return `GFR-FO-12: falta ${row.descripcion} para la ${PHASE_LABELS[phase]} cuenta`;
  }

  return null;
}
