import "server-only";

import { buildGfrFo17Data } from "../build/buildGfrFo17Data";
import { GFR_FO_17_SIGNATURE_ANCHORS } from "../cellMaps/gfrFo17.cells";
import { fillXlsxTemplate } from "../fillXlsxTemplate";
import { FORM_TEMPLATES } from "../formTemplates";
import { resolveFormSignatureImage } from "../resolveFormSignatureImage";
import type { FormPackageContext } from "../types";

export async function renderGfrFo17Xlsx(ctx: FormPackageContext) {
  const template = FORM_TEMPLATES.GFR_FO_17;

  const [contratistaImage, supervisorImage] = await Promise.all([
    resolveFormSignatureImage(
      ctx.contractor.signaturePath,
      "El contratista no tiene firma registrada en Perfil",
      "No se encontró el archivo de firma del contratista",
      "El archivo de firma del contratista debe ser PNG, JPEG o GIF"
    ),
    resolveFormSignatureImage(
      ctx.reviewer.signaturePath,
      "El supervisor/jefe no tiene firma registrada en Perfil",
      "No se encontró el archivo de firma del supervisor/jefe",
      "El archivo de firma del supervisor/jefe debe ser PNG, JPEG o GIF"
    ),
  ]);

  return fillXlsxTemplate(
    template.file,
    template.sheet,
    buildGfrFo17Data(ctx),
    {
      trimRowsAfter: 143,
      printArea: "A1:K143",
      removeOtherSheets: true,
      clearColumnsAfter: "K",
      resetDimensions: { lastRow: 143, lastCol: 11 },
      pageSetup: {
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        scale: 60,
        orientation: "landscape",
        horizontalCentered: true,
        margins: {
          left: 0.4,
          right: 0.4,
          top: 0.5,
          bottom: 0.5,
          header: 0.2,
          footer: 0.2,
        },
      },
      images: [
        {
          ...contratistaImage,
          tl: { ...GFR_FO_17_SIGNATURE_ANCHORS.contratista.tl },
          ext: { ...GFR_FO_17_SIGNATURE_ANCHORS.contratista.ext },
          editAs: "absolute",
        },
        {
          ...supervisorImage,
          tl: { ...GFR_FO_17_SIGNATURE_ANCHORS.supervisor.tl },
          ext: { ...GFR_FO_17_SIGNATURE_ANCHORS.supervisor.ext },
          editAs: "absolute",
        },
      ],
    }
  );
}
