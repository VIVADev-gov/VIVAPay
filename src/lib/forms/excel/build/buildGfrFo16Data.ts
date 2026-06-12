import { GFR_FO_16_CELLS } from "../cellMaps/gfrFo16.cells";
import type { CellValues, FormPackageContext } from "../types";

export function buildGfrFo16Data(ctx: FormPackageContext): CellValues {
  const { contract, contractor, paymentAccount, ordenador } = ctx;
  const ordenadorNombre = ordenador.name.toUpperCase();
  const contratistaNombre = contractor.name.toUpperCase();

  return {
    [GFR_FO_16_CELLS.ordenadorNombre]: ordenadorNombre,
    [GFR_FO_16_CELLS.ordenadorOrganizacion]: ordenador.organizationalUnitName,
    [GFR_FO_16_CELLS.contratista]: contratistaNombre,
    [GFR_FO_16_CELLS.documentoContratista]: contractor.documentId,
    [GFR_FO_16_CELLS.numeroContrato]: contract.numeroContrato,
    [GFR_FO_16_CELLS.numeroDisponibilidad]: contract.numeroDisponibilidad,
    [GFR_FO_16_CELLS.numeroCompromiso]: contract.numeroCompromiso,
    [GFR_FO_16_CELLS.numeroCuentaCobro]: paymentAccount.numero,
    [GFR_FO_16_CELLS.valorPago]: paymentAccount.valor ?? 0,
    [GFR_FO_16_CELLS.ordenadorNombreFirma]: ordenadorNombre,
    [GFR_FO_16_CELLS.ordenadorDocumento]: ordenador.documentId,
    [GFR_FO_16_CELLS.ordenadorOrganizacionFirma]:
      ordenador.organizationalUnitName,
  };
}
