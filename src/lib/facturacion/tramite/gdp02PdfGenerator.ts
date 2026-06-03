import "server-only";

import fs from "fs";
import Handlebars from "handlebars";
import path from "path";

import { convertOfficeBufferToPdf } from "@/lib/office/convertOfficeToPdf";
import { buildGdpFo02PrintData } from "./printData/buildGdpFo02PrintData";
import type { TramiteBuildContext } from "./types";

const TEMPLATE_PATH = path.join(
    process.cwd(),
    "src",
    "lib",
    "facturacion",
    "tramite",
    "templates",
    "gdp-fo-02.hbs"
);

let compiledTemplate: Handlebars.TemplateDelegate | null = null;

function compileGdpFo02Template(): Handlebars.TemplateDelegate {
    if (compiledTemplate) return compiledTemplate;
    const source = fs.readFileSync(TEMPLATE_PATH, "utf-8");
    compiledTemplate = Handlebars.compile(source);
    return compiledTemplate;
}

/**
 * GDP-FO-02 vía HTML + LibreOffice (la plantilla DOCX no es compatible con LO headless).
 * Mismo contenido que la vista previa HTML del modal.
 */
export async function generateGdp02Pdf(ctx: TramiteBuildContext): Promise<Buffer> {
    const data = buildGdpFo02PrintData(ctx);
    const html = compileGdpFo02Template()(data);
    const result = convertOfficeBufferToPdf(Buffer.from(html, "utf-8"), "html", "gdp-fo-02");

    if (!result.ok) {
        const detail = result.detail ? `: ${result.detail}` : "";
        throw new Error(`No se pudo generar PDF de GDP-FO-02 (LibreOffice requerido)${detail}`);
    }
    return result.pdf;
}
