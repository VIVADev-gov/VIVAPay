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
  | "PENDIENTE_CONTRATISTA"
  | "ENVIADA_CONTRATISTA"
  | "PENDIENTE_SUPERVISOR"
  | "PENDIENTE_DIRECTOR"
  | "PENDIENTE_ENVIO_CAD"
  | "PENDIENTE_JEFE"
  | "ENVIADA"
  | "ENVIADA_CAD"
  | "APROBADA"
  | "RECHAZADA";

export type PublicCuentaCobroDevolucion = {
  id: string;
  deRol: string;
  deUserId: string;
  mensaje: string;
  fecha: string | null;
  estadoAnterior: CuentaCobroStatus;
  estadoNuevo: CuentaCobroStatus;
};

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
  declaracionesJuradas?: PaymentAccountDeclarations | null;
  gfrFo11?: GfrFo11Responses | null;
  directorFirmadoAt?: string | null;
  directorFirmadoPor?: string | null;
  jefeFirmadoAt?: string | null;
  jefeFirmadoPor?: string | null;
  enviadaCadAt?: string | null;
  enviadaCadPor?: string | null;
  fechaPago?: string | null;
  devoluciones?: PublicCuentaCobroDevolucion[];
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type PaymentAccountReviewContractor = {
  id: string;
  name: string;
  email: string;
  documentId: string;
  organizationalUnitName: string;
  subareaName?: string | null;
};

export type PaymentAccountReviewListItem = {
  paymentAccount: PublicCuentaCobro;
  contract: Pick<
    PublicContrato,
    "id" | "numeroContrato" | "actual" | "objeto"
  >;
  contractor: PaymentAccountReviewContractor;
};

export type PaymentAccountReviewListResponse = {
  items: PaymentAccountReviewListItem[];
};

export type PaymentAccountReviewDetailResponse = {
  paymentAccount: PublicCuentaCobro;
  contract: PublicContrato;
  contractor: PaymentAccountReviewContractor;
  paymentAccounts: PublicCuentaCobro[];
  activities: PublicCuentaCobroActividadItem[];
  contractDocuments: PublicCuentaCobroDocumento[];
  accountDocuments: PublicCuentaCobroDocumento[];
};

export type CuentaCobroDocumentScope = "CONTRATO" | "CUENTA_COBRO";

export type SeguridadSocialPlantillaModo = "UNICO" | "SEPARADO";

export type SeguridadSocialPlantillaMetadata = {
  modo: SeguridadSocialPlantillaModo;
  plantillaPension: string;
  plantillaEps: string;
  plantillaArl: string;
};

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
  metadata?: SeguridadSocialPlantillaMetadata | null;
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

export type CuentaCobroActividadSoporteTipo = "TEXTO" | "ARCHIVO";

export type PublicCuentaCobroActividadItem = {
  id?: string;
  orden: number;
  actividad: string;
  accion: string;
  soporteTipo: CuentaCobroActividadSoporteTipo;
  soporteTexto: string | null;
  soporteArchivoPath: string | null;
  soporteArchivoNombre: string | null;
  soporteArchivoMimeType: string | null;
  soporteArchivoSize: number | null;
  ejecucion: number;
};

export type PublicCuentaCobroActividades = {
  id: string | null;
  userId?: string;
  contratoId?: string;
  cuentaCobroId?: string;
  numeroCuenta?: number;
  numeroContrato?: string;
  actividades: PublicCuentaCobroActividadItem[];
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CuentaCobroActivitiesResponse = {
  activities: PublicCuentaCobroActividades;
};

export type PaymentAccountDeclarations = {
  contratoMultiplesTrabajadores: boolean;
  rutActualizado: boolean;
};

export type CuentaCobroDeclarationsResponse = {
  declarations: PaymentAccountDeclarations | null;
};

export type GfrFo11Responses = {
  ingresosAnioAnterior: number;
  ingresosAnioActual: number;
  multiplesEstablecimientos: boolean;
  establecimientoDesarrolloActividad: boolean;
  usuarioAduanero: boolean;
  contratosServiciosAnioAnterior: number;
  contratosServiciosAnioActual: number;
  contratosEstadoAnioAnterior: number;
  contratosEstadoAnioActual: number;
  consignacionesAnioAnterior: number;
  consignacionesAnioActual: number;
  regimenSimple: boolean;
};

export type GfrFo11ConfigMeta = {
  uvtAnioAnterior: number;
  uvtAnioActual: number;
  anioAnterior: number;
  anioActual: number;
  uvtThreshold: number;
};

export type CuentaCobroGfrFo11Response = {
  responses: GfrFo11Responses | null;
  config: GfrFo11ConfigMeta;
};
