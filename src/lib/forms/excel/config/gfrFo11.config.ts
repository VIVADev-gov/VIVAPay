function parseNumberEnv(name: string, fallback = 0) {
  const raw = process.env[name];
  if (!raw?.trim()) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export function getGfrFo11Config() {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  return {
    uvtAnioAnterior: parseNumberEnv("GFR_FO_11_UVT_PREVIOUS", 35607),
    uvtAnioActual: parseNumberEnv("GFR_FO_11_UVT_CURRENT", 36308),
    anioAnterior: parseNumberEnv("GFR_FO_11_YEAR_PREVIOUS", previousYear),
    anioActual: parseNumberEnv("GFR_FO_11_YEAR_CURRENT", currentYear),
  };
}
