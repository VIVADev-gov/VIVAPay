/**
 * Helper de correo: SMTP Office 365 + plantillas Handlebars.
 *
 * Uso:
 *   import { sendEmail } from '@/lib/email';
 *   await sendEmail({
 *     to: 'usuario@ejemplo.com',
 *     subject: 'Bienvenida',
 *     template: 'ejemplo',
 *     data: { nombre: 'Juan', mensaje: '...', url: 'https://...' },
 *   });
 *
 * Variables de entorno: SMTP_USER, SMTP_PASSWORD, SMTP_FROM (opcional).
 */

export { sendEmail } from "@/lib/email/send";
export type { SendEmailOptions, SendEmailResult } from "@/lib/email/send";
export { getTransporter, isEmailConfigured, getDefaultFrom } from "@/lib/email/config";
export { compileTemplate } from "@/lib/email/compile";
export { APP_URL } from "@/lib/email/constants";
