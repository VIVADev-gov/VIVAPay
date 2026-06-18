import { sanitizeDigitsOnly } from "@/utils/inputSanitizers";

export type SeguridadSocialPlantillaModo = "UNICO" | "SEPARADO";

export type SeguridadSocialPlantillaMetadata = {
  modo: SeguridadSocialPlantillaModo;
  plantillaPension: string;
  plantillaEps: string;
  plantillaArl: string;
};

export const SEGURIDAD_SOCIAL_TIPO = "SEGURIDAD_SOCIAL";

export function isPlantillaNumber(value: string) {
  return /^\d+$/.test(value.trim());
}

export function sanitizePlantillaInput(value: string) {
  return sanitizeDigitsOnly(value);
}

export function buildPlantillaMetadata(input: {
  modo: SeguridadSocialPlantillaModo;
  plantillaUnica?: string;
  plantillaPension?: string;
  plantillaEps?: string;
  plantillaArl?: string;
}): { metadata: SeguridadSocialPlantillaMetadata | null; error: string | null } {
  if (input.modo === "UNICO") {
    const plantilla = sanitizePlantillaInput(input.plantillaUnica ?? "");
    if (!plantilla) {
      return { metadata: null, error: "Indica el número de plantilla" };
    }
    if (!isPlantillaNumber(plantilla)) {
      return { metadata: null, error: "El número de plantilla solo puede contener dígitos" };
    }
    return {
      metadata: {
        modo: "UNICO",
        plantillaPension: plantilla,
        plantillaEps: plantilla,
        plantillaArl: plantilla,
      },
      error: null,
    };
  }

  const plantillaPension = sanitizePlantillaInput(input.plantillaPension ?? "");
  const plantillaEps = sanitizePlantillaInput(input.plantillaEps ?? "");
  const plantillaArl = sanitizePlantillaInput(input.plantillaArl ?? "");

  if (!plantillaPension || !plantillaEps || !plantillaArl) {
    return {
      metadata: null,
      error: "Completa el número de plantilla para pensión, EPS y ARL",
    };
  }

  if (
    !isPlantillaNumber(plantillaPension) ||
    !isPlantillaNumber(plantillaEps) ||
    !isPlantillaNumber(plantillaArl)
  ) {
    return {
      metadata: null,
      error: "Los números de plantilla solo pueden contener dígitos",
    };
  }

  return {
    metadata: {
      modo: "SEPARADO",
      plantillaPension,
      plantillaEps,
      plantillaArl,
    },
    error: null,
  };
}

export function parseSeguridadSocialPlantillaMetadata(
  value: unknown
): SeguridadSocialPlantillaMetadata | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const modo = record.modo === "SEPARADO" ? "SEPARADO" : "UNICO";
  const plantillaPension = String(record.plantillaPension ?? "").trim();
  const plantillaEps = String(record.plantillaEps ?? "").trim();
  const plantillaArl = String(record.plantillaArl ?? "").trim();

  if (
    !isPlantillaNumber(plantillaPension) ||
    !isPlantillaNumber(plantillaEps) ||
    !isPlantillaNumber(plantillaArl)
  ) {
    return null;
  }

  const inferredModo: SeguridadSocialPlantillaModo =
    plantillaPension === plantillaEps && plantillaPension === plantillaArl
      ? "UNICO"
      : modo;

  return {
    modo: inferredModo,
    plantillaPension,
    plantillaEps,
    plantillaArl,
  };
}

export function formatSeguridadSocialPlantillaSummary(
  metadata: SeguridadSocialPlantillaMetadata
) {
  if (
    metadata.modo === "UNICO" ||
    (metadata.plantillaPension === metadata.plantillaEps &&
      metadata.plantillaPension === metadata.plantillaArl)
  ) {
    return `Plantilla ${metadata.plantillaPension} (pensión, EPS y ARL)`;
  }

  return `Pensión: ${metadata.plantillaPension} · EPS: ${metadata.plantillaEps} · ARL: ${metadata.plantillaArl}`;
}
