function parseNumberEnv(name: string, fallback = 0) {
  const raw = process.env[name];
  if (!raw?.trim()) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export function getGfrFo17Config() {
  return {
    smmlv: parseNumberEnv("GFR_FO_17_SMMLV", 0),
    aporteSalud: parseNumberEnv("GFR_FO_17_APORTE_SALUD", 0.125),
    aportePension: parseNumberEnv("GFR_FO_17_APORTE_PENSION", 0.16),
    aporteArl: parseNumberEnv("GFR_FO_17_APORTE_ARL", 0.00525),
    ibcFactor: 0.4,
  };
}

export type GfrFo17Config = ReturnType<typeof getGfrFo17Config>;
