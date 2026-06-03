import "server-only";

import fs from "fs";
import Handlebars from "handlebars";
import path from "path";

import { convertOfficeBufferToPdf } from "@/lib/office/convertOfficeToPdf";
import { TRAMITE_FORMAT_CODES } from "./tramiteDocumentConfig";
import { buildGfrFo07PrintData } from "./printData/buildGfrFo07PrintData";
import { buildGfrFo09PrintData } from "./printData/buildGfrFo09PrintData";
import { buildGfrFo16PrintData } from "./printData/buildGfrFo16PrintData";
import type { TramiteBuildContext, TramiteHtmlTemplate } from "./types";

const TEMPLATES_DIR = path.join(process.cwd(), "src", "lib", "facturacion", "tramite", "templates");

const templateCache = new Map<string, Handlebars.TemplateDelegate>();

function compileTramiteTemplate(name: TramiteHtmlTemplate): Handlebars.TemplateDelegate {
    const cached = templateCache.get(name);
    if (cached) return cached;
    const filePath = path.join(TEMPLATES_DIR, `${name}.hbs`);
    const source = fs.readFileSync(filePath, "utf-8");
    const fn = Handlebars.compile(source);
    templateCache.set(name, fn);
    return fn;
}

function formatCodeForTemplate(template: TramiteHtmlTemplate): string {
    switch (template) {
        case "gfr-fo-09":
            return TRAMITE_FORMAT_CODES.GFR_FO_09;
        case "gfr-fo-07":
            return TRAMITE_FORMAT_CODES.GFR_FO_07;
        case "gfr-fo-16":
            return TRAMITE_FORMAT_CODES.GFR_FO_16;
    }
}

function printDataForTemplate(ctx: TramiteBuildContext, template: TramiteHtmlTemplate): Record<string, unknown> {
    switch (template) {
        case "gfr-fo-09":
            return buildGfrFo09PrintData(ctx.detalle);
        case "gfr-fo-07":
            return buildGfrFo07PrintData(ctx.detalle);
        case "gfr-fo-16":
            return buildGfrFo16PrintData(ctx.detalle);
    }
}

export async function generateHtmlFormPdf(
    ctx: TramiteBuildContext,
    template: TramiteHtmlTemplate
): Promise<Buffer> {
    const compile = compileTramiteTemplate(template);
    const html = compile(printDataForTemplate(ctx, template));
    const htmlBuffer = Buffer.from(html, "utf-8");
    const baseName = formatCodeForTemplate(template).toLowerCase().replace(/[^a-z0-9-]+/g, "-");

    const result = convertOfficeBufferToPdf(htmlBuffer, "html", baseName);
    if (!result.ok) {
        const detail = result.detail ? `: ${result.detail}` : "";
        throw new Error(
            `No se pudo generar PDF de ${formatCodeForTemplate(template)} (LibreOffice requerido)${detail}`
        );
    }
    return result.pdf;
}
