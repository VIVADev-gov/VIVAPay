import type { SeguridadSocialAportes } from "@/lib/cuentas-cobro/seguridadSocialPlantilla";
import { GFR_FO_17_HEADER_CELLS } from "../cellMaps/gfrFo17.cells";
import type { GfrFo17Config } from "../config/gfrFo17.config";
import type { CellValues } from "../types";

export type GfrFo17SeguridadSocialAportes = {
  ibc: number;
  pctBaseValorCuenta: number;
  aporteSalud: number;
  aportePension: number;
  aporteArl: number;
  pctAporteSalud: number;
  pctAportePension: number;
  pctAporteArl: number;
};

export function computeGfrFo17SeguridadSocialAportes(
  valorCuenta: number,
  config: GfrFo17Config,
  aportesManuales?: SeguridadSocialAportes | null
): GfrFo17SeguridadSocialAportes {
  const ibcTeorico = valorCuenta * config.ibcFactor;
  const ibc = Math.max(ibcTeorico, config.smmlv);
  const pctBaseValorCuenta = valorCuenta > 0 ? ibc / valorCuenta : 0;

  const useManual =
    aportesManuales &&
    aportesManuales.aporteSalud > 0 &&
    aportesManuales.aportePension > 0 &&
    aportesManuales.aporteArl > 0;

  const aporteSalud = useManual
    ? aportesManuales.aporteSalud
    : Math.round(ibc * config.aporteSalud);
  const aportePension = useManual
    ? aportesManuales.aportePension
    : Math.round(ibc * config.aportePension);
  const aporteArl = useManual
    ? aportesManuales.aporteArl
    : Math.round(ibc * config.aporteArl);

  return {
    ibc,
    pctBaseValorCuenta,
    aporteSalud,
    aportePension,
    aporteArl,
    pctAporteSalud: ibc > 0 ? aporteSalud / ibc : 0,
    pctAportePension: ibc > 0 ? aportePension / ibc : 0,
    pctAporteArl: ibc > 0 ? aporteArl / ibc : 0,
  };
}

type GfrFo17HeaderCells = typeof GFR_FO_17_HEADER_CELLS;

export function applyGfrFo17SeguridadSocialCells(
  values: CellValues,
  header: GfrFo17HeaderCells,
  aportes: GfrFo17SeguridadSocialAportes
) {
  values[header.ibcSalud] = aportes.ibc;
  values[header.ibcPension] = aportes.ibc;
  values[header.ibcArl] = aportes.ibc;

  values[header.aporteSalud] = aportes.aporteSalud;
  values[header.aportePension] = aportes.aportePension;
  values[header.aporteArl] = aportes.aporteArl;

  values[header.pctBaseValorCuentaSalud] = aportes.pctBaseValorCuenta;
  values[header.pctBaseValorCuentaPension] = aportes.pctBaseValorCuenta;
  values[header.pctBaseValorCuentaArl] = aportes.pctBaseValorCuenta;

  values[header.pctAporteIbcSalud] = aportes.pctAporteSalud;
  values[header.pctAporteIbcPension] = aportes.pctAportePension;
  values[header.pctAporteIbcArl] = aportes.pctAporteArl;
}
