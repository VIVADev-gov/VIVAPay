import { computeGfrFo11ThresholdAnswer } from "@/lib/cuentas-cobro/gfrFo11Responses";
import {
  GFR_FO_11_CELLS,
  GFR_FO_11_SI_NO_ROWS,
} from "../cellMaps/gfrFo11.cells";
import { getGfrFo11Config } from "../config/gfrFo11.config";
import type { CellValues, FormPackageContext } from "../types";
import { applyGfrFo11SiNo, splitDateParts } from "./formExcelHelpers";

export function buildGfrFo11Data(ctx: FormPackageContext): CellValues {
  const { contract, contractor, paymentAccount } = ctx;
  const responses = paymentAccount.gfrFo11;
  if (!responses) {
    throw new Error("Faltan las respuestas del GFR-FO-11");
  }

  const config = getGfrFo11Config();
  const signatureDate =
    paymentAccount.periodoFin ?? paymentAccount.periodoInicio ?? new Date();
  const { day, month, year } = splitDateParts(signatureDate);

  const values: CellValues = {
    [GFR_FO_11_CELLS.nombre]: contractor.name.toUpperCase(),
    [GFR_FO_11_CELLS.documento]: contractor.documentId,
    [GFR_FO_11_CELLS.numeroContrato]: contract.numeroContrato,
    [GFR_FO_11_CELLS.diaFirma]: day,
    [GFR_FO_11_CELLS.mesFirma]: month,
    [GFR_FO_11_CELLS.anioFirma]: year,
    [GFR_FO_11_CELLS.documentoFirma]: contractor.documentId,
    [GFR_FO_11_CELLS.uvtAnioAnterior]: config.uvtAnioAnterior,
    [GFR_FO_11_CELLS.uvtAnioActual]: config.uvtAnioActual,
    [GFR_FO_11_CELLS.ingresosAnioAnteriorLabel]: config.anioAnterior,
    [GFR_FO_11_CELLS.ingresosAnioAnteriorValor]: responses.ingresosAnioAnterior,
    [GFR_FO_11_CELLS.ingresosAnioActualLabel]: config.anioActual,
    [GFR_FO_11_CELLS.ingresosAnioActualValor]: responses.ingresosAnioActual,
    [GFR_FO_11_CELLS.contratosServiciosAnioAnteriorLabel]: config.anioAnterior,
    [GFR_FO_11_CELLS.contratosServiciosAnioAnteriorValor]:
      responses.contratosServiciosAnioAnterior,
    [GFR_FO_11_CELLS.contratosServiciosAnioActualLabel]: config.anioActual,
    [GFR_FO_11_CELLS.contratosServiciosAnioActualValor]:
      responses.contratosServiciosAnioActual,
    [GFR_FO_11_CELLS.contratosEstadoAnioAnteriorLabel]: config.anioAnterior,
    [GFR_FO_11_CELLS.contratosEstadoAnioAnteriorValor]:
      responses.contratosEstadoAnioAnterior,
    [GFR_FO_11_CELLS.contratosEstadoAnioActualLabel]: config.anioActual,
    [GFR_FO_11_CELLS.contratosEstadoAnioActualValor]:
      responses.contratosEstadoAnioActual,
    [GFR_FO_11_CELLS.consignacionesAnioAnteriorLabel]: config.anioAnterior,
    [GFR_FO_11_CELLS.consignacionesAnioAnteriorValor]:
      responses.consignacionesAnioAnterior,
    [GFR_FO_11_CELLS.consignacionesAnioActualLabel]: config.anioActual,
    [GFR_FO_11_CELLS.consignacionesAnioActualValor]:
      responses.consignacionesAnioActual,
  };

  applyGfrFo11SiNo(
    values,
    GFR_FO_11_SI_NO_ROWS.ingresosAnioAnterior,
    computeGfrFo11ThresholdAnswer(
      responses.ingresosAnioAnterior,
      config.uvtAnioAnterior
    )
  );
  applyGfrFo11SiNo(
    values,
    GFR_FO_11_SI_NO_ROWS.ingresosAnioActual,
    computeGfrFo11ThresholdAnswer(
      responses.ingresosAnioActual,
      config.uvtAnioActual
    )
  );
  applyGfrFo11SiNo(
    values,
    GFR_FO_11_SI_NO_ROWS.multiplesEstablecimientos,
    responses.multiplesEstablecimientos
  );
  applyGfrFo11SiNo(
    values,
    GFR_FO_11_SI_NO_ROWS.establecimientoDesarrolloActividad,
    responses.establecimientoDesarrolloActividad
  );
  applyGfrFo11SiNo(
    values,
    GFR_FO_11_SI_NO_ROWS.usuarioAduanero,
    responses.usuarioAduanero
  );
  applyGfrFo11SiNo(
    values,
    GFR_FO_11_SI_NO_ROWS.contratosServiciosAnioAnterior,
    computeGfrFo11ThresholdAnswer(
      responses.contratosServiciosAnioAnterior,
      config.uvtAnioAnterior
    )
  );
  applyGfrFo11SiNo(
    values,
    GFR_FO_11_SI_NO_ROWS.contratosServiciosAnioActual,
    computeGfrFo11ThresholdAnswer(
      responses.contratosServiciosAnioActual,
      config.uvtAnioActual
    )
  );
  applyGfrFo11SiNo(
    values,
    GFR_FO_11_SI_NO_ROWS.contratosEstadoAnioAnterior,
    computeGfrFo11ThresholdAnswer(
      responses.contratosEstadoAnioAnterior,
      config.uvtAnioAnterior
    )
  );
  applyGfrFo11SiNo(
    values,
    GFR_FO_11_SI_NO_ROWS.contratosEstadoAnioActual,
    computeGfrFo11ThresholdAnswer(
      responses.contratosEstadoAnioActual,
      config.uvtAnioActual
    )
  );
  applyGfrFo11SiNo(
    values,
    GFR_FO_11_SI_NO_ROWS.consignacionesAnioAnterior,
    computeGfrFo11ThresholdAnswer(
      responses.consignacionesAnioAnterior,
      config.uvtAnioAnterior
    )
  );
  applyGfrFo11SiNo(
    values,
    GFR_FO_11_SI_NO_ROWS.consignacionesAnioActual,
    computeGfrFo11ThresholdAnswer(
      responses.consignacionesAnioActual,
      config.uvtAnioActual
    )
  );
  applyGfrFo11SiNo(
    values,
    GFR_FO_11_SI_NO_ROWS.regimenSimple,
    responses.regimenSimple
  );

  return values;
}
