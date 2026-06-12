import "server-only";

import { buildGfrFo16Data } from "../build/buildGfrFo16Data";
import { fillXlsxTemplate } from "../fillXlsxTemplate";
import { FORM_TEMPLATES } from "../formTemplates";
import type { FormPackageContext } from "../types";

export async function renderGfrFo16Xlsx(ctx: FormPackageContext) {
  const template = FORM_TEMPLATES.GFR_FO_16;
  return fillXlsxTemplate(
    template.file,
    template.sheet,
    buildGfrFo16Data(ctx),
    {
      trimRowsAfter: 35,
      printArea: "A1:I35",
    }
  );
}
