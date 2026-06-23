const CDP_RPC_PATTERN = /^(\d+)\s+del\s+(\d{2})\/(\d{2})\/(\d{4})$/i;

export type CdpRpcReferenceParts = {
  numero: string;
  fecha: string;
};

export type CdpRpcReferenceFormValue = {
  cdpNumero: string;
  cdpFecha: string;
  rpcNumero: string;
  rpcFecha: string;
};

export const EMPTY_CDP_RPC_REFERENCE: CdpRpcReferenceFormValue = {
  cdpNumero: "",
  cdpFecha: "",
  rpcNumero: "",
  rpcFecha: "",
};

export function parseCdpRpcReference(value: string): CdpRpcReferenceParts {
  const match = value.trim().match(CDP_RPC_PATTERN);
  if (!match) {
    return { numero: "", fecha: "" };
  }

  const [, numero, dd, mm, yyyy] = match;
  return { numero, fecha: `${yyyy}-${mm}-${dd}` };
}

export function formatCdpRpcDisplayDate(isoDate: string) {
  const [yyyy, mm, dd] = isoDate.split("-");
  if (!yyyy || !mm || !dd) return "";
  return `${dd}/${mm}/${yyyy}`;
}

export function buildCdpRpcReference(numero: string, fechaIso: string) {
  const normalizedNumero = numero.trim();
  const fecha = formatCdpRpcDisplayDate(fechaIso);
  if (!normalizedNumero || !fecha) return "";
  return `${normalizedNumero} del ${fecha}`;
}

export function sanitizeCdpRpcNumero(value: string) {
  return value.replace(/\D/g, "");
}

export function getCdpRpcReferenceValidationErrors(
  value: CdpRpcReferenceFormValue
) {
  const errors: Record<string, string> = {};

  if (!value.cdpNumero.trim()) {
    errors.cdpNumero = "Requerido";
  }
  if (!value.cdpFecha) {
    errors.cdpFecha = "Requerido";
  }
  if (!value.rpcNumero.trim()) {
    errors.rpcNumero = "Requerido";
  }
  if (!value.rpcFecha) {
    errors.rpcFecha = "Requerido";
  }

  return errors;
}

export function cdpRpcReferenceFromContract(cdp: string, rpc: string) {
  const parsedCdp = parseCdpRpcReference(cdp);
  const parsedRpc = parseCdpRpcReference(rpc);

  return {
    cdpNumero: parsedCdp.numero,
    cdpFecha: parsedCdp.fecha,
    rpcNumero: parsedRpc.numero,
    rpcFecha: parsedRpc.fecha,
  };
}
