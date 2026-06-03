/**
 * Configuración SMTP para Office 365 (lectura dinámica en runtime).
 * Variables de entorno:
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
 * - SMTP_FROM: remitente completo (ej. "Vivapay <noreply@viva.gov.co>")
 * - SMTP_FROM_NAME: nombre visible si SMTP_FROM no está definido
 */

import nodemailer from "nodemailer";
import { logger } from "@/lib/logger";

export type EmailConfig = {
  host: string;
  port: number;
  secure: boolean;
  auth?: { user: string; pass: string };
  from: string;
};

let transporterInstance: nodemailer.Transporter | null = null;
let transporterAuthKey: string | null = null;

function readEnv() {
  return {
    host: process.env.SMTP_HOST ?? "smtp.office365.com",
    port: Number(process.env.SMTP_PORT ?? "587"),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASSWORD ?? "",
    fromRaw: process.env.SMTP_FROM?.trim() ?? "",
    fromName: process.env.SMTP_FROM_NAME?.trim() ?? "",
  };
}

/** Construye el remitente en cada llamada (no cacheado al importar el módulo). */
export function resolveDefaultFrom(): string {
  const { fromRaw, fromName, user } = readEnv();

  if (fromRaw) return fromRaw;

  if (fromName && user) {
    return `${fromName} <${user}>`;
  }

  return user;
}

/** Lee la configuración SMTP actual desde process.env. */
export function getEmailConfig(): EmailConfig {
  const { host, port, user, pass } = readEnv();

  return {
    host,
    port,
    secure: false,
    auth: user && pass ? { user, pass } : undefined,
    from: resolveDefaultFrom(),
  };
}

/**
 * Crea o devuelve el transporte Nodemailer (singleton).
 * Se recrea si cambian las credenciales en runtime.
 */
export function getTransporter(): nodemailer.Transporter | null {
  const config = getEmailConfig();

  if (!config.auth) {
    logger.warn("[Email] SMTP_USER o SMTP_PASSWORD no configurados; no se enviarán correos.");
    transporterInstance = null;
    transporterAuthKey = null;
    return null;
  }

  const authKey = `${config.auth.user}:${config.auth.pass}:${config.host}:${config.port}`;

  if (transporterInstance && transporterAuthKey === authKey) {
    return transporterInstance;
  }

  transporterInstance = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });
  transporterAuthKey = authKey;

  return transporterInstance;
}

export function getDefaultFrom(): string {
  return getEmailConfig().from;
}

export function isEmailConfigured(): boolean {
  const config = getEmailConfig();
  return Boolean(config.auth?.user && config.auth?.pass);
}
