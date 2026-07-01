function parseNumberEnv(name: string, fallback = 0) {
  const raw = process.env[name];
  if (!raw?.trim()) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function readConfigNumber(serverKey: string, clientKey: string, fallback: number) {
  const raw = process.env[serverKey] ?? process.env[clientKey];
  if (!raw?.trim()) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export function getGfrFo17Config() {
  return {
    smmlv: readConfigNumber(
      "GFR_FO_17_SMMLV",
      "NEXT_PUBLIC_GFR_FO_17_SMMLV",
      1_750_905
    ),
    aporteSalud: readConfigNumber(
      "GFR_FO_17_APORTE_SALUD",
      "NEXT_PUBLIC_GFR_FO_17_APORTE_SALUD",
      0.125
    ),
    aportePension: readConfigNumber(
      "GFR_FO_17_APORTE_PENSION",
      "NEXT_PUBLIC_GFR_FO_17_APORTE_PENSION",
      0.16
    ),
    aporteArl: readConfigNumber(
      "GFR_FO_17_APORTE_ARL",
      "NEXT_PUBLIC_GFR_FO_17_APORTE_ARL",
      0.00525
    ),
    ibcFactor: 0.4,
  };
}

export type GfrFo17Config = ReturnType<typeof getGfrFo17Config>;
