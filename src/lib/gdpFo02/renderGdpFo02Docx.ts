import "server-only";

import fs from "fs";
import path from "path";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import type { GdpFo02FormModel } from "@/app/viva/components/facturacion/gdp-fo-02/gdpFo02Types";
import { buildGdpFo02DocxData } from "./buildGdpFo02DocxData";

const TEMPLATE_REL = path.join("public", "templates", "gdp-fo-02-template.docx");

function templatePath(): string {
    return path.join(process.cwd(), TEMPLATE_REL);
}

export function renderGdpFo02DocxBuffer(model: GdpFo02FormModel): Buffer {
    const tpl = templatePath();
    if (!fs.existsSync(tpl)) {
        throw new Error(
            `No existe la plantilla ${TEMPLATE_REL}. Ejecute: pnpm run gdp02:template`
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
    doc.render(buildGdpFo02DocxData(model));
    return doc.toBuffer() as Buffer;
}
