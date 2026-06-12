import "server-only";

import path from "path";
import { resolveReadableUploadAbsolutePath } from "@/lib/uploadsStorage";
import { buildGfrFo16Data } from "../build/buildGfrFo16Data";
import {
  fillXlsxTemplate,
  type FillXlsxImageExtension,
} from "../fillXlsxTemplate";
import { FORM_TEMPLATES } from "../formTemplates";
import type { FormPackageContext } from "../types";

const GFR_FO_16_SIGNATURE_ANCHOR = {
  tl: { col: 0.4, row: 25.1 },
  br: { col: 2.6, row: 26.7 },
} as const;

function resolveImageExtension(
  absolutePath: string
): FillXlsxImageExtension | null {
  const ext = path.extname(absolutePath).toLowerCase();
  if (ext === ".png") return "png";
  if (ext === ".jpg" || ext === ".jpeg") return "jpeg";
  if (ext === ".gif") return "gif";
  return null;
}

export async function renderGfrFo16Xlsx(ctx: FormPackageContext) {
  const { ordenador } = ctx;

  if (!ordenador.signaturePath) {
    throw new Error(
      "El ordenador del gasto no tiene firma registrada en Perfil"
    );
  }

  const signatureAbsolutePath = await resolveReadableUploadAbsolutePath(
    ordenador.signaturePath
  );
  if (!signatureAbsolutePath) {
    throw new Error(
      "No se encontró el archivo de firma del ordenador del gasto"
    );
  }

  const extension = resolveImageExtension(signatureAbsolutePath);
  if (!extension) {
    throw new Error(
      "El archivo de firma del ordenador debe ser PNG, JPEG o GIF"
    );
  }

  const template = FORM_TEMPLATES.GFR_FO_16;
  return fillXlsxTemplate(
    template.file,
    template.sheet,
    buildGfrFo16Data(ctx),
    {
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
          absolutePath: signatureAbsolutePath,
          extension,
          tl: { ...GFR_FO_16_SIGNATURE_ANCHOR.tl },
          br: { ...GFR_FO_16_SIGNATURE_ANCHOR.br },
        },
      ],
    }
  );
}
