import type { FormOrdenador } from "@/lib/cuentas-cobro/resolveFormOrdenador";
import type { FormReviewer } from "@/lib/cuentas-cobro/resolveFormReviewer";
import type { SeguridadSocialPlantillaMetadata } from "@/lib/cuentas-cobro/seguridadSocialPlantilla";
import type {
  CuentaCobroStatus,
  GfrFo11Responses,
  PaymentAccountDeclarations,
} from "@/types/contratos";
import type { PaymentAccountReembolsables } from "@/lib/cuentas-cobro/paymentAccountReembolsables";

export type FormActivityItem = {
  actividad: string;
  accion: string;
  soporteTipo: "TEXTO" | "ARCHIVO";
  soporteTexto?: string | null;
  soporteArchivoNombre?: string | null;
  ejecucion: number;
};

export type CellValue = string | number | boolean | Date | null | undefined;

export type CellValues = Record<string, CellValue>;

export type FormContractSnapshot = {
  numeroContrato: string;
  objeto: string;
  plazoMeses: number;
  fechaActaInicio: Date | null;
  fechaFinal: Date | null;
  concepto: string;
  rubro: string;
  cdp: string;
  valorCdp: number;
  rpc: string;
  valorRpc: number;
  valorInicialContrato: number;
  numeroDisponibilidad: string;
  numeroCompromiso: string;
  totalRecursosComprometidos: number;
  tieneReembolsables: boolean;
  rubroRembolsable: string | null;
  conceptoRembolsable: string | null;
};

export type FormContractorSnapshot = {
  id: string;
  name: string;
  documentId: string;
  organizationalUnitName: string;
  organizationalUnitType: string;
  organizationalUnitId: string;
  subareaId?: string | null;
  signaturePath: string | null;
};

export type FormPaymentAccountSnapshot = {
  id: string;
  numero: number;
  estado: CuentaCobroStatus;
  periodoInicio: Date | null;
  periodoFin: Date | null;
  valor: number | null;
  fechaEnvio: Date | null;
  enviadaCadAt: Date | null;
  fechaPago: Date | null;
  declaracionesJuradas: PaymentAccountDeclarations | null;
  gfrFo11: GfrFo11Responses | null;
  reembolsables: PaymentAccountReembolsables | null;
};

export type FormPackageContext = {
  contract: FormContractSnapshot;
  contractor: FormContractorSnapshot;
  reviewer: FormReviewer;
  ordenador: FormOrdenador;
  paymentAccount: FormPaymentAccountSnapshot;
  paymentAccounts: FormPaymentAccountSnapshot[];
  activities: FormActivityItem[];
  seguridadSocialMetadata: SeguridadSocialPlantillaMetadata | null;
};

export type FormPdfAttachment = {
  code: string;
  filename: string;
  buffer: Buffer;
};
