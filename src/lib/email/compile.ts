import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { getAppHost } from "@/lib/appHost";
import { logger } from "@/lib/logger";

// Registrar helper global para la base URL (logo y links)
Handlebars.registerHelper("baseUrl", () => getAppHost());

const TEMPLATES_DIR = path.join(process.cwd(), "src", "lib", "email", "templates");
const PARTIALS_DIR = path.join(TEMPLATES_DIR, "partials");

const compiledCache = new Map<string, Handlebars.TemplateDelegate>();

function ensurePartialsRegistered(): void {
  if (compiledCache.has("__partials_loaded__")) return;
  try {
    const partialFiles = fs.readdirSync(PARTIALS_DIR);
    for (const file of partialFiles) {
      if (!file.endsWith(".hbs")) continue;
      const name = path.basename(file, ".hbs");
      const content = fs.readFileSync(path.join(PARTIALS_DIR, file), "utf-8");
      Handlebars.registerPartial(name, content);
    }
    compiledCache.set("__partials_loaded__", () => "");
  } catch (err) {
    // partials opcionales
  }
}

/**
 * Compila una plantilla por nombre (sin extensión) con los datos dados.
 * Las plantillas están en src/lib/email/templates/*.hbs
 * y los partials en src/lib/email/templates/partials/*.hbs
 */
export function compileTemplate(templateName: string, data: Record<string, unknown>): string {
  ensurePartialsRegistered();
  const key = templateName;
  const isDev = process.env.NODE_ENV === "development";
  let fn = isDev ? null : compiledCache.get(key);

  if (!fn) {
    const filePath = path.join(TEMPLATES_DIR, `${templateName}.hbs`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Plantilla de correo no encontrada: ${templateName}`);
    }
    const source = fs.readFileSync(filePath, "utf-8");
    fn = Handlebars.compile(source);
    if (!isDev) {
      compiledCache.set(key, fn);
    }
  }
  return fn(data);
}
