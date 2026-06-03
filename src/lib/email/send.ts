import { getTransporter, getDefaultFrom } from "@/lib/email/config";
import { compileTemplate } from "@/lib/email/compile";
import { logger } from "@/lib/logger";
import path from "path";

export interface EmailFileAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface SendEmailOptions {
  /** Destinatario(s). Puede ser un email o lista separada por comas */
  to: string | string[];
  /** Asunto del correo */
  subject: string;
  /** Nombre de la plantilla (archivo en templates sin .hbs) */
  template: string;
  /** Datos para la plantilla Handlebars */
  data: Record<string, unknown>;
  /** Remitente (opcional; por defecto SMTP_FROM o SMTP_USER) */
  from?: string;
  /** Texto plano alternativo (opcional) */
  text?: string;
  /** Adjuntos PDF u otros archivos (además del logo inline) */
  fileAttachments?: EmailFileAttachment[];
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envía un correo usando la plantilla Handlebars indicada.
 * Si SMTP no está configurado, registra un warning y devuelve success: false.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, template, data, from, text, fileAttachments } = options;
  const transporter = getTransporter();
  if (!transporter) {
    logger.warn("[Email] No se envió correo: SMTP no configurado.");
    return { success: false, error: "SMTP no configurado" };
  }

  const override = process.env.EMAIL_OVERRIDE;
  const toList = override ? [override] : (Array.isArray(to) ? to : [to]);
  const toStr = toList.join(", ");

  try {
    const html = compileTemplate(template, data);
    const logoPath = path.join(process.cwd(), "public", "logoviva.png");
    const info = await transporter.sendMail({
      from: from ?? getDefaultFrom(),
      to: toStr,
      subject,
      text: text ?? undefined,
      html,
      attachments: [
        {
          filename: "logoviva.png",
          path: logoPath,
          cid: "logoviva",
          contentDisposition: "inline",
          headers: {
            "Content-ID": "<logoviva>",
          },
        },
        ...(fileAttachments ?? []).map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType ?? "application/pdf",
        })),
      ],
    });

    logger.info(`[Email] Correo enviado a ${toStr} (template: ${template})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("[Email] Error enviando correo:", message);
    return { success: false, error: message };
  }
}
