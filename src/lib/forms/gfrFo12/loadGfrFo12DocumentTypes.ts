import "server-only";

import { connectDB } from "@/lib/db/mongoose";
import type { FormPackageContext } from "@/lib/forms/excel/types";
import {
  CUENTA_COBRO_DOCUMENT_SCOPE,
  CuentaCobroDocumento,
} from "@/models/cuentaCobroDocumento";
import type { GfrFo12DocumentTypes } from "./gfrFo12Checklist";

export async function loadGfrFo12DocumentTypes(
  userId: string,
  contractId: string,
  ctx: FormPackageContext
): Promise<GfrFo12DocumentTypes> {
  await connectDB();

  const [contractDocuments, accountDocuments] = await Promise.all([
    CuentaCobroDocumento.find({
      userId,
      contratoId: contractId,
      scope: CUENTA_COBRO_DOCUMENT_SCOPE.CONTRATO,
    })
      .select("tipoDocumento filePath")
      .exec(),
    CuentaCobroDocumento.find({
      userId,
      contratoId: contractId,
      numeroCuenta: ctx.paymentAccount.numero,
      scope: CUENTA_COBRO_DOCUMENT_SCOPE.CUENTA_COBRO,
    })
      .select("tipoDocumento filePath")
      .exec(),
  ]);

  const hasFile = (doc: { filePath?: string | null }) =>
    Boolean(doc.filePath?.trim());

  return {
    contractTypes: new Set(
      contractDocuments.filter(hasFile).map((doc) => doc.tipoDocumento)
    ),
    accountTypes: new Set(
      accountDocuments.filter(hasFile).map((doc) => doc.tipoDocumento)
    ),
  };
}
