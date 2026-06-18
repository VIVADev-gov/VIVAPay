import "server-only";

import fs from "fs";
import path from "path";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import type { PaymentAccountReembolsables } from "@/lib/cuentas-cobro/paymentAccountReembolsables";
import type { FormPackageContext } from "@/lib/forms/excel/types";
import { buildGthFo52DocxData } from "./buildGthFo52DocxData";

const TEMPLATE_REL = path.join("public", "templates", "gth-fo-52-template.docx");

function templatePath() {
  return path.join(process.cwd(), TEMPLATE_REL);
}

export function renderGthFo52DocxBuffer(
  ctx: FormPackageContext,
  reembolsables: PaymentAccountReembolsables
): Buffer {
  const tpl = templatePath();
  if (!fs.existsSync(tpl)) {
    throw new Error(
      `No existe la plantilla ${TEMPLATE_REL}. Ejecute: node scripts/build-gth-fo-52-template.cjs`
    );
  }

  const content = fs.readFileSync(tpl);
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter() {
      return "";
    },
  });

  doc.render(buildGthFo52DocxData(ctx, reembolsables));
  return doc.toBuffer() as Buffer;
}
