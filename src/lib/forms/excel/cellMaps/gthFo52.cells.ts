export const GTH_FO_52_CELLS = {
  periodoCorte: "F9",
  documento: "F11",
  nombres: "F13",
  area: "F17",
  coordinador: "F19",
  modalidad: "N19",
} as const;

export const GTH_FO_52_ENCARGO_START_ROW = 23;
export const GTH_FO_52_ENCARGO_MAX_ROWS = 8;

export const GTH_FO_52_ENCARGO_COLUMNS = {
  id: "D",
  contrato: "E",
  destino: "F",
  otrosDestinos: "G",
  zona: "H",
  fechaSalida: "I",
  fechaRegreso: "J",
  pernocta: "K",
  tipoTransporte: "P",
} as const;
