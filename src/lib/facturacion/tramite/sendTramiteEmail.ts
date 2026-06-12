import "server-only";

import { getEmailCad } from "@/lib/email/getEmailCad";
import { sendEmail } from "@/lib/email/send";
import type { TramiteAttachment, TramiteSendResult } from "./types";

export interface SendTramiteEmailInput {
    proveedor: string;
    nit: string | null;
    radicado: string | null;
    attachments: TramiteAttachment[];
}

export async function sendTramiteEmail(input: SendTramiteEmailInput): Promise<TramiteSendResult> {
    const dest = getEmailCad();
    if (!dest) {
        return {
            success: false,
            error: "EMAIL_CAD no está configurado en el servidor",
        };
    }

    const attachmentNames = input.attachments.map((a) => a.filename);
    const subject = `Trámite de facturación — ${input.proveedor || "Proveedor"}`.slice(0, 200);

    const result = await sendEmail({
        to: dest,
        subject,
        template: "tramite-enviado",
        data: {
            proveedor: input.proveedor,
            nit: input.nit ?? "",
            radicado: input.radicado ?? "",
            attachmentNames,
            attachmentCount: attachmentNames.length,
        },
        fileAttachments: input.attachments.map((a) => ({
            filename: a.filename,
            content: a.buffer,
            contentType: a.contentType,
        })),
    });

    if (!result.success) {
        return { success: false, error: result.error ?? "No se pudo enviar el correo" };
    }

    return {
        success: true,
        messageId: result.messageId,
        attachmentCount: input.attachments.length,
    };
}
