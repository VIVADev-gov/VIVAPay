import "server-only";

import { buildGfrFo11Data } from "../build/buildGfrFo11Data";
import { fillXlsxTemplate } from "../fillXlsxTemplate";
import { FORM_TEMPLATES } from "../formTemplates";
import type { FormPackageContext } from "../types";

export async function renderGfrFo11Xlsx(ctx: FormPackageContext) {
  const template = FORM_TEMPLATES.GFR_FO_11;
  return fillXlsxTemplate(
    template.file,
    template.sheet,
    buildGfrFo11Data(ctx)
  );
}
