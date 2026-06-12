import "server-only";

import { buildCadEmailPackage } from "@/lib/cuentas-cobro/buildCadEmailPackage";
import { sendPaymentAccountFormsEmail } from "@/lib/forms/excel/sendPaymentAccountFormsEmail";
import logger from "@/lib/logger";

export type SendCadPackageEmailInput = {
  userId: string;
  contractId: string;
  accountNumber: number;
  to?: string | string[];
};

export type SendCadPackageEmailResult =
  | {
      success: true;
      messageId?: string;
      attachmentCount: number;
      attachments: Array<{ code: string; filename: string; size: number }>;
    }
  | { success: false; error: string };

export async function sendCadPackageEmail(
  input: SendCadPackageEmailInput
): Promise<SendCadPackageEmailResult> {
  const packageResult = await buildCadEmailPackage(
    input.userId,
    input.contractId,
    input.accountNumber
  );

  if (!packageResult.success) {
    logger.warn("[cuentas-cobro/cad-package] No se pudo armar el paquete", {
      error: packageResult.error,
      contractId: input.contractId,
      accountNumber: input.accountNumber,
    });
    return { success: false, error: packageResult.error };
  }

  const { context, attachments } = packageResult;

  const emailResult = await sendPaymentAccountFormsEmail({
    to: input.to ?? "",
    contractorName: context.contractor.name,
    contractorDocumentId: context.contractor.documentId,
    contractNumber: context.contract.numeroContrato,
    accountNumber: context.paymentAccount.numero,
    attachments,
  });

  if (!emailResult.success) {
    logger.warn("[cuentas-cobro/cad-package] No se pudo enviar el correo al CAD", {
      error: emailResult.error,
      contractId: input.contractId,
      accountNumber: input.accountNumber,
    });
    return { success: false, error: emailResult.error ?? "No se pudo enviar el correo" };
  }

  return {
    success: true,
    messageId: emailResult.messageId,
    attachmentCount: emailResult.attachmentCount,
    attachments: attachments.map((item) => ({
      code: item.code,
      filename: item.filename,
      size: item.buffer.length,
    })),
  };
}
