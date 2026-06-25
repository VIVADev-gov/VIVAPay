import "server-only";

import { buildGfrFo16CellFormats } from "../build/buildGfrFo16CellFormats";
import { buildGfrFo16Data } from "../build/buildGfrFo16Data";
import { fillXlsxTemplate } from "../fillXlsxTemplate";
import { FORM_TEMPLATES } from "../formTemplates";
import { resolveFormSignatureImage } from "../resolveFormSignatureImage";
import type { FormPackageContext } from "../types";

const GFR_FO_16_SIGNATURE_ANCHOR = {
  tl: { col: 0.7, row: 23.7 },
  br: { col: 2.1, row: 25.5 },
} as const;

export async function renderGfrFo16Xlsx(ctx: FormPackageContext) {
  const { ordenador } = ctx;

  const signature = await resolveFormSignatureImage(
    ordenador.signaturePath,
    "El ordenador del gasto no tiene firma registrada en Perfil",
    "No se encontró el archivo de firma del ordenador del gasto",
    "El archivo de firma del ordenador debe ser PNG, JPEG o GIF"
  );

  const template = FORM_TEMPLATES.GFR_FO_16;
  return fillXlsxTemplate(
    template.file,
    template.sheet,
    buildGfrFo16Data(ctx),
    {
      cellFormats: buildGfrFo16CellFormats(),
      trimRowsAfter: 35,
      printArea: "A1:I35",
      removeOtherSheets: true,
      pageSetup: {
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 1,
        orientation: "portrait",
      },
      images: [
        {
          ...signature,
          tl: { ...GFR_FO_16_SIGNATURE_ANCHOR.tl },
          br: { ...GFR_FO_16_SIGNATURE_ANCHOR.br },
        },
      ],
    }
  );
}
