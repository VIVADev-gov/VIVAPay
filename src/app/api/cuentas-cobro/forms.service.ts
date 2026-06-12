import "server-only";

import { sendCadPackageEmail } from "@/lib/cuentas-cobro/sendCadPackageEmail";
import { buildFormPackage } from "@/lib/forms/excel/buildFormPackage";

export const cuentasCobroFormsService = {
  async generateForms(
    userId: string,
    contractId: string,
    numeroCuenta: number
  ) {
    const result = await buildFormPackage(userId, contractId, numeroCuenta);
    if (!result.success) {
      throw new Error(result.error);
    }
    return {
      attachments: result.attachments.map((item) => ({
        code: item.code,
        filename: item.filename,
        size: item.buffer.length,
      })),
    };
  },

  async generateAndSendForms(
    userId: string,
    contractId: string,
    numeroCuenta: number,
    to?: string | string[]
  ) {
    const emailResult = await sendCadPackageEmail({
      userId,
      contractId,
      accountNumber: numeroCuenta,
      to,
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error);
    }

    return {
      messageId: emailResult.messageId,
      attachmentCount: emailResult.attachmentCount,
      attachments: emailResult.attachments,
    };
  },
};
