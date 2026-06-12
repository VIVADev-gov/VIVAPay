import type { FormOrdenador } from "@/lib/cuentas-cobro/resolveFormOrdenador";
import type { FormReviewer } from "@/lib/cuentas-cobro/resolveFormReviewer";
import type { SeguridadSocialPlantillaMetadata } from "@/lib/cuentas-cobro/seguridadSocialPlantilla";
import type {
  GfrFo11Responses,
  PaymentAccountDeclarations,
} from "@/types/contratos";

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
};

export type FormContractorSnapshot = {
  id: string;
  name: string;
  documentId: string;
  organizationalUnitName: string;
  organizationalUnitType: string;
  organizationalUnitId: string;
  subareaId?: string | null;
};

export type FormPaymentAccountSnapshot = {
  id: string;
  numero: number;
  periodoInicio: Date | null;
  periodoFin: Date | null;
  valor: number | null;
  declaracionesJuradas: PaymentAccountDeclarations | null;
  gfrFo11: GfrFo11Responses | null;
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
