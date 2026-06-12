import "server-only";

import { buildGfrFo17Data } from "../build/buildGfrFo17Data";
import { fillXlsxTemplate } from "../fillXlsxTemplate";
import { FORM_TEMPLATES } from "../formTemplates";
import type { FormPackageContext } from "../types";

export async function renderGfrFo17Xlsx(ctx: FormPackageContext) {
  const template = FORM_TEMPLATES.GFR_FO_17;
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
        fitToPage: false,
        fitToWidth: 1,
        fitToHeight: 0,
        orientation: "portrait",
      },
    }
  );
}
