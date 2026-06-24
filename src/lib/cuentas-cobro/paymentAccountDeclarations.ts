import type { PaymentAccountDeclarations } from "@/types/contratos";

export type { PaymentAccountDeclarations };

export type PaymentAccountDeclarationItemKey = keyof PaymentAccountDeclarations;

export type PaymentAccountDeclarationItem = {
  key: PaymentAccountDeclarationItemKey;
  number: number;
  title: string;
  intro?: string;
  statement: string;
  commitment?: string;
  statusLabels: {
    on: string;
    off: string;
  };
};

export const PAYMENT_ACCOUNT_DECLARATION_ITEMS: PaymentAccountDeclarationItem[] = [
  {
    key: "contratoMultiplesTrabajadores",
    number: 1,
    title: "Retención en la fuente (artículo 383 E.T.)",
    intro:
      "Para efectos de la aplicación de la tabla de retención en la fuente establecida en el artículo 383 del Estatuto Tributario, incorporada por el artículo 33 del Decreto 1808 de 2019:",
    statement:
      "He contratado o vinculado más de un trabajador asociado a mi actividad económica por al menos noventa (90) días continuos o discontinuos",
    commitment:
      "En el momento en que contrate o vincule más de un trabajador asociado a mi actividad económica, me comprometo a informar.",
    statusLabels: {
      on: "Declara que sí ha vinculado más de un trabajador; aplica la retención del artículo 383.",
      off: "Declara que no ha vinculado más de un trabajador bajo los criterios del artículo 383.",
    },
  },
  {
    key: "rutActualizado",
    number: 2,
    title: "Actualización del RUT",
    statement:
      "Declaro que a la fecha de presentación de este documento, mi RUT se encuentra actualizado",
    statusLabels: {
      on: "Confirma que su RUT está vigente y actualizado a la fecha de presentación.",
      off: "Indica que su RUT no se encuentra actualizado a la fecha de presentación.",
    },
  },
];

export function paymentAccountStoreKey(contractId: string, numeroCuenta: number) {
  return `${contractId}:${numeroCuenta}`;
}

export const defaultPaymentAccountDeclarations: PaymentAccountDeclarations = {
  contratoMultiplesTrabajadores: false,
  rutActualizado: true,
};

export function getDeclarationAnswerLabel(value: boolean) {
  return value ? "Sí" : "No";
}

export function getDeclarationStatusLabel(
  item: PaymentAccountDeclarationItem,
  value: boolean
) {
  return value ? item.statusLabels.on : item.statusLabels.off;
}

export function formatDeclarationsSummary(
  declarations: PaymentAccountDeclarations
) {
  return `Retención art. 383: ${getDeclarationAnswerLabel(declarations.contratoMultiplesTrabajadores)} · RUT actualizado: ${getDeclarationAnswerLabel(declarations.rutActualizado)}`;
}

export function parsePaymentAccountDeclarations(
  value: unknown
): PaymentAccountDeclarations | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  if (
    typeof record.contratoMultiplesTrabajadores !== "boolean" ||
    typeof record.rutActualizado !== "boolean"
  ) {
    return null;
  }

  return {
    contratoMultiplesTrabajadores: record.contratoMultiplesTrabajadores,
    rutActualizado: record.rutActualizado,
  };
}
