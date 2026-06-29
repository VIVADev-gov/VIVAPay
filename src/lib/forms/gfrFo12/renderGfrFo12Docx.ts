import "server-only";

import fs from "fs";
import path from "path";
import Docxtemplater from "docxtemplater";
import ImageModule from "docxtemplater-image-module-free";
import PizZip from "pizzip";
import { resolveFormSignatureImage } from "@/lib/forms/excel/resolveFormSignatureImage";
import type { FormPackageContext } from "@/lib/forms/excel/types";
import { buildGfrFo12DocxData } from "./buildGfrFo12DocxData";
import type { GfrFo12DocumentTypes } from "./gfrFo12Checklist";

const TEMPLATE_REL = path.join("public", "templates", "gfr-fo-12-template.docx");
const SIGNATURE_WIDTH = 180;
const SIGNATURE_HEIGHT = 45;

function templatePath() {
  return path.join(process.cwd(), TEMPLATE_REL);
}

function createImageModule(): ImageModule {
  return new ImageModule({
    centered: false,
    getImage(tagValue: string) {
      return fs.readFileSync(tagValue);
    },
    getSize() {
      return [SIGNATURE_WIDTH, SIGNATURE_HEIGHT];
    },
  });
}

export async function renderGfrFo12Docx(
  ctx: FormPackageContext,
  uploaded: GfrFo12DocumentTypes
): Promise<Buffer> {
  const tpl = templatePath();
  if (!fs.existsSync(tpl)) {
    throw new Error(
      `No existe la plantilla ${TEMPLATE_REL}. Ejecute: node scripts/build-gfr-fo-12-template.cjs`
    );
  }

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

  const data = buildGfrFo12DocxData(ctx, uploaded, {
    contratistaFirma: contratistaImage.absolutePath,
    supervisorFirma: supervisorImage.absolutePath,
  });

  const zip = new PizZip(fs.readFileSync(tpl));
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    modules: [createImageModule()],
    nullGetter() {
      return "";
    },
  });

  doc.render(data);
  return doc.toBuffer() as Buffer;
}
