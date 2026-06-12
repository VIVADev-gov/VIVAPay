import "server-only";

import {
  includesGfrFo11,
  resolvePaymentPhase,
} from "@/lib/cuentas-cobro/paymentAccountRules";
import { parseGfrFo11Responses } from "@/lib/cuentas-cobro/gfrFo11Responses";
import { convertOfficeBufferToPdf } from "@/lib/office/convertOfficeToPdf";
import type { PublicCuentaCobro } from "@/types/contratos";
import { buildFormPackageContext } from "./buildFormPackageContext";
import { FORM_TEMPLATES } from "./formTemplates";
import { renderGfrFo11Xlsx } from "./render/renderGfrFo11Xlsx";
import { renderGfrFo16Xlsx } from "./render/renderGfrFo16Xlsx";
import { renderGfrFo17Xlsx } from "./render/renderGfrFo17Xlsx";
import type { FormPdfAttachment } from "./types";

export type FormPackageResult =
  | {
      success: true;
      attachments: FormPdfAttachment[];
    }
  | {
      success: false;
      error: string;
    };

function sanitizeFilenamePart(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

async function xlsxToPdf(
  buffer: Buffer,
  code: string,
  filename: string
): Promise<FormPdfAttachment> {
  const result = convertOfficeBufferToPdf(
    buffer,
    "xlsx",
    sanitizeFilenamePart(code).toLowerCase()
  );
  if (!result.ok) {
    const detail = result.detail ? `: ${result.detail}` : "";
    throw new Error(
      `No se pudo convertir ${code} a PDF (LibreOffice requerido)${detail}`
    );
  }

  return {
    code,
    filename: sanitizeFilenamePart(filename),
    buffer: result.pdf,
  };
}

export async function buildFormPackage(
  userId: string,
  contractId: string,
  numeroCuenta: number
): Promise<FormPackageResult> {
  try {
    const ctx = await buildFormPackageContext(userId, contractId, numeroCuenta);
    const suffix = `cuenta-${numeroCuenta}`;
    const phase = resolvePaymentPhase(
      { numero: ctx.paymentAccount.numero } as PublicCuentaCobro,
      ctx.paymentAccounts.map(
        (account) => ({ numero: account.numero }) as PublicCuentaCobro
      )
    );
    const shouldIncludeGfrFo11 = includesGfrFo11(phase);

    if (shouldIncludeGfrFo11 && !parseGfrFo11Responses(ctx.paymentAccount.gfrFo11)) {
      return {
        success: false,
        error: "Debes completar el certificado GFR-FO-11 antes de generar el paquete",
      };
    }

    const [gfrFo16, gfrFo17, gfrFo11] = await Promise.all([
      renderGfrFo16Xlsx(ctx),
      renderGfrFo17Xlsx(ctx),
      shouldIncludeGfrFo11 ? renderGfrFo11Xlsx(ctx) : Promise.resolve(null),
    ]);

    const attachmentPromises = [
      xlsxToPdf(
        gfrFo16,
        FORM_TEMPLATES.GFR_FO_16.code,
        `${FORM_TEMPLATES.GFR_FO_16.code}-${suffix}.pdf`
      ),
      xlsxToPdf(
        gfrFo17,
        FORM_TEMPLATES.GFR_FO_17.code,
        `${FORM_TEMPLATES.GFR_FO_17.code}-${suffix}.pdf`
      ),
    ];

    if (shouldIncludeGfrFo11 && gfrFo11) {
      attachmentPromises.push(
        xlsxToPdf(
          gfrFo11,
          FORM_TEMPLATES.GFR_FO_11.code,
          `${FORM_TEMPLATES.GFR_FO_11.code}-${suffix}.pdf`
        )
      );
    }

    const attachments = await Promise.all(attachmentPromises);

    return { success: true, attachments };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al generar formularios",
    };
  }
}
