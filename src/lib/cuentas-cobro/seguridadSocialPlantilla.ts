import { sanitizeDigitsOnly } from "@/utils/inputSanitizers";

export type SeguridadSocialPlantillaModo = "UNICO" | "SEPARADO";

export type SeguridadSocialAportes = {
  aporteSalud: number;
  aportePension: number;
  aporteArl: number;
};

export type SeguridadSocialPlantillaMetadata = {
  modo: SeguridadSocialPlantillaModo;
  plantillaPension: string;
  plantillaEps: string;
  plantillaArl: string;
  aportesManuales?: SeguridadSocialAportes | null;
};

export const SEGURIDAD_SOCIAL_TIPO = "SEGURIDAD_SOCIAL";

export function isPlantillaNumber(value: string) {
  return /^\d+$/.test(value.trim());
}

export function sanitizePlantillaInput(value: string) {
  return sanitizeDigitsOnly(value);
}

function parseOptionalAporte(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed);
}

export function hasSeguridadSocialAportesManuales(
  metadata: Pick<SeguridadSocialPlantillaMetadata, "aportesManuales">
) {
  const aportes = metadata.aportesManuales;
  if (!aportes) return false;
  return (
    aportes.aporteSalud > 0 &&
    aportes.aportePension > 0 &&
    aportes.aporteArl > 0
  );
}

export function buildPlantillaMetadata(input: {
  modo: SeguridadSocialPlantillaModo;
  plantillaUnica?: string;
  plantillaPension?: string;
  plantillaEps?: string;
  plantillaArl?: string;
  useAportesManuales?: boolean;
  aporteSalud?: string | number;
  aportePension?: string | number;
  aporteArl?: string | number;
}): { metadata: SeguridadSocialPlantillaMetadata | null; error: string | null } {
  let baseMetadata: Omit<SeguridadSocialPlantillaMetadata, "aportesManuales">;

  if (input.modo === "UNICO") {
    const plantilla = sanitizePlantillaInput(input.plantillaUnica ?? "");
    if (!plantilla) {
      return { metadata: null, error: "Indica el número de plantilla" };
    }
    if (!isPlantillaNumber(plantilla)) {
      return { metadata: null, error: "El número de plantilla solo puede contener dígitos" };
    }
    baseMetadata = {
      modo: "UNICO",
      plantillaPension: plantilla,
      plantillaEps: plantilla,
      plantillaArl: plantilla,
    };
  } else {
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

    baseMetadata = {
      modo: "SEPARADO",
      plantillaPension,
      plantillaEps,
      plantillaArl,
    };
  }

  if (!input.useAportesManuales) {
    return { metadata: baseMetadata, error: null };
  }

  const aporteSalud = parseOptionalAporte(input.aporteSalud);
  const aportePension = parseOptionalAporte(input.aportePension);
  const aporteArl = parseOptionalAporte(input.aporteArl);

  if (
    aporteSalud === null ||
    aportePension === null ||
    aporteArl === null ||
    aporteSalud <= 0 ||
    aportePension <= 0 ||
    aporteArl <= 0
  ) {
    return {
      metadata: null,
      error: "Indica los valores de aporte de salud, pensión y ARL según tu planilla PILA",
    };
  }

  return {
    metadata: {
      ...baseMetadata,
      aportesManuales: {
        aporteSalud,
        aportePension,
        aporteArl,
      },
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

  const aportesRecord =
    record.aportesManuales && typeof record.aportesManuales === "object"
      ? (record.aportesManuales as Record<string, unknown>)
      : null;

  const aporteSalud = parseOptionalAporte(
    aportesRecord?.aporteSalud ?? record.aporteSalud
  );
  const aportePension = parseOptionalAporte(
    aportesRecord?.aportePension ?? record.aportePension
  );
  const aporteArl = parseOptionalAporte(
    aportesRecord?.aporteArl ?? record.aporteArl
  );

  const aportesManuales =
    aporteSalud !== null &&
    aportePension !== null &&
    aporteArl !== null &&
    aporteSalud > 0 &&
    aportePension > 0 &&
    aporteArl > 0
      ? { aporteSalud, aportePension, aporteArl }
      : null;

  return {
    modo: inferredModo,
    plantillaPension,
    plantillaEps,
    plantillaArl,
    ...(aportesManuales ? { aportesManuales } : {}),
  };
}

export function formatSeguridadSocialPlantillaSummary(
  metadata: SeguridadSocialPlantillaMetadata
) {
  const plantillaSummary =
    metadata.modo === "UNICO" ||
    (metadata.plantillaPension === metadata.plantillaEps &&
      metadata.plantillaPension === metadata.plantillaArl)
      ? `Plantilla ${metadata.plantillaPension} (pensión, EPS y ARL)`
      : `Pensión: ${metadata.plantillaPension} · EPS: ${metadata.plantillaEps} · ARL: ${metadata.plantillaArl}`;

  if (!hasSeguridadSocialAportesManuales(metadata)) {
    return plantillaSummary;
  }

  const { aporteSalud, aportePension, aporteArl } = metadata.aportesManuales!;
  return `${plantillaSummary} · Aportes PILA: salud ${aporteSalud.toLocaleString("es-CO")}, pensión ${aportePension.toLocaleString("es-CO")}, ARL ${aporteArl.toLocaleString("es-CO")}`;
}
