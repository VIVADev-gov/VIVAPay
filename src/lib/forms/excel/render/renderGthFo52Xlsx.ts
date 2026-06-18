import "server-only";

import { buildGthFo52Data } from "../build/buildGthFo52Data";
import { fillXlsxTemplate } from "../fillXlsxTemplate";
import { FORM_TEMPLATES } from "../formTemplates";
import type { FormPackageContext } from "../types";

export async function renderGthFo52Xlsx(ctx: FormPackageContext) {
  const template = FORM_TEMPLATES.GTH_FO_52;
  return fillXlsxTemplate(
    template.file,
    template.sheet,
    buildGthFo52Data(ctx)
  );
}
