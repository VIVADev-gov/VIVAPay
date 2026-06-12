import "server-only";

import type { CadEmailAttachment } from "@/lib/cuentas-cobro/cadEmailAttachment";
import { getEmailCad } from "@/lib/email/getEmailCad";
import { sendEmail } from "@/lib/email/send";

export type SendPaymentAccountFormsEmailInput = {
  to: string | string[];
  contractorName: string;
  contractorDocumentId: string;
  contractNumber: string;
  accountNumber: number;
  attachments: CadEmailAttachment[];
};

export type SendPaymentAccountFormsEmailResult =
  | { success: true; messageId?: string; attachmentCount: number }
  | { success: false; error: string };

export async function sendPaymentAccountFormsEmail(
  input: SendPaymentAccountFormsEmailInput
): Promise<SendPaymentAccountFormsEmailResult> {
  const destination = input.to || getEmailCad();
  if (!destination) {
    return {
      success: false,
      error: "EMAIL_CAD no está configurado",
    };
  }

  const attachmentNames = input.attachments.map((item) => item.filename);
  const subject = `Cuenta de cobro ${input.accountNumber} — ${input.contractorName}`.slice(
    0,
    200
  );

  const result = await sendEmail({
    to: destination,
    subject,
    template: "cuenta-cobro-formularios",
    data: {
      contractorName: input.contractorName,
      contractorDocumentId: input.contractorDocumentId,
      contractNumber: input.contractNumber,
      accountNumber: input.accountNumber,
      attachmentNames,
      attachmentCount: attachmentNames.length,
    },
    fileAttachments: input.attachments.map((item) => ({
      filename: item.filename,
      content: item.buffer,
      contentType: item.contentType ?? "application/pdf",
    })),
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error ?? "No se pudo enviar el correo",
    };
  }

  return {
    success: true,
    messageId: result.messageId,
    attachmentCount: input.attachments.length,
  };
}
