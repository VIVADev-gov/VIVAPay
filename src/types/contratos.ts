export type ContractModificationType = "ADICION" | "PRORROGA" | "SUSPENSION";

export type PublicContractSnapshot = {
  numeroContrato?: string;
  objeto?: string;
  plazoMeses?: number;
  fechaActaInicio?: string | null;
  fechaFinal?: string | null;
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
};

export type PublicContractModification = PublicContractSnapshot & {
  id: string;
  tipo: ContractModificationType;
  descripcion?: string;
  fechaRegistro?: string | null;
};

export type PublicContrato = PublicContractSnapshot & {
  id: string;
  userId: string;
  numeroContrato: string;
  objeto: string;
  plazoMeses: number;
  fechaActaInicio: string | null;
  fechaFinal: string | null;
  concepto: string;
  rubro: string;
  cdp: string;
  valorCdp: number;
  rpc: string;
  valorRpc: number;
  valorInicialContrato: number;
  numeroDisponibilidad: string;
  numeroCompromiso: string;
  modificaciones: PublicContractModification[];
  vigente: boolean;
  actual: PublicContractSnapshot;
  paymentAccountCount?: number;
  submittedPaymentAccountCount?: number;
  canSubmitPaymentAccount?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CreateContratoBody = {
  numeroContrato: string;
  objeto: string;
  plazoMeses: number;
  fechaActaInicio: string;
  fechaFinal: string;
  concepto: string;
  rubro: string;
  cdp: string;
  valorCdp: number;
  rpc: string;
  valorRpc: number;
  valorInicialContrato: number;
  numeroDisponibilidad: string;
  numeroCompromiso: string;
  submittedPaymentAccountsCount?: number;
};

export type CreateContratoResponse = {
  contract: PublicContrato;
  paymentAccountsGenerated: number;
  paymentAccountsRegularized?: number;
};

export type CuentaCobroStatus =
  | "BORRADOR"
  | "PENDIENTE"
  | "HABILITADA"
  | "ENVIADA"
  | "APROBADA"
  | "RECHAZADA";

export type PublicCuentaCobro = {
  id: string;
  userId: string;
  contratoId: string;
  numero: number;
  periodoInicio: string | null;
  periodoFin: string | null;
  fechaHabilitadaEnvio: string | null;
  fechaLimiteEnvio: string | null;
  fechaEnvio: string | null;
  estado: CuentaCobroStatus;
  valor: number | null;
  observaciones: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CuentaCobroDocumentScope = "CONTRATO" | "CUENTA_COBRO";

export type PublicCuentaCobroDocumento = {
  id: string;
  userId: string;
  contratoId: string;
  cuentaCobroId: string | null;
  numeroCuenta: number | null;
  numeroContrato: string;
  tipoDocumento: string;
  scope: CuentaCobroDocumentScope;
  filePath: string;
  originalName: string | null;
  size: number | null;
  mimeType: string | null;
  required: boolean;
  generated: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ContratosResponse = {
  contracts: PublicContrato[];
  currentContract: PublicContrato | null;
  lastContract: PublicContrato | null;
};

export type ContratoDetailResponse = {
  contract: PublicContrato;
  paymentAccounts: PublicCuentaCobro[];
};

export type CuentasCobroSummaryResponse = {
  currentContract: PublicContrato | null;
  nextPaymentAccount: PublicCuentaCobro | null;
  lastPaymentAccount: PublicCuentaCobro | null;
  completedAllPaymentAccounts: boolean;
  message: string | null;
};

export type CuentaCobroContractDocumentsResponse = {
  documents: PublicCuentaCobroDocumento[];
};

export type CuentaCobroAccountDocumentsResponse = {
  contractDocuments: PublicCuentaCobroDocumento[];
  accountDocuments: PublicCuentaCobroDocumento[];
};
