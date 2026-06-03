"use client";

import { CalendarClock, ReceiptText } from "lucide-react";
import Link from "next/link";
import {
  TableCardView,
  type DataTableColumnConfig,
} from "@/components/table";
import {
  canViewPaymentAccount,
  getPaymentAccountActionLabel,
  getPaymentAccountHref,
} from "@/lib/cuentas-cobro/paymentAccountAccess";
import type { PublicCuentaCobro } from "@/types/contratos";
import { formatCurrency, formatDate } from "@/utils/formatters";

type PaymentAccountsTableProps = {
  contractId: string;
  paymentAccounts: PublicCuentaCobro[];
  loading?: boolean;
  onRefresh?: () => void;
  highlightNumero?: number | null;
};

export default function PaymentAccountsTable({
  contractId,
  paymentAccounts,
  loading = false,
  onRefresh,
  highlightNumero = null,
}: PaymentAccountsTableProps) {
  const columns: DataTableColumnConfig<PublicCuentaCobro>[] = [
    {
      field: "numero",
      header: "No.",
      sortable: true,
      body: (row) => (
        <span className="font-semibold text-foreground">Cuenta {row.numero}</span>
      ),
    },
    {
      field: "periodoInicio",
      header: "Periodo",
      body: (row) =>
        `${formatDate(row.periodoInicio)} - ${formatDate(row.periodoFin)}`,
    },
    {
      field: "fechaHabilitadaEnvio",
      header: "Disponible desde",
      sortable: true,
      body: (row) => formatDate(row.fechaHabilitadaEnvio),
    },
    {
      field: "estado",
      header: "Estado",
      body: (row) => (
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {row.estado}
        </span>
      ),
    },
    {
      field: "valor",
      header: "Valor",
      align: "right",
      body: (row) => formatCurrency(row.valor),
    },
    {
      field: "numero",
      header: "",
      body: (row) =>
        canViewPaymentAccount(row) ? (
          <Link
            href={getPaymentAccountHref(contractId, row.numero)}
            className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:text-ring"
          >
            {getPaymentAccountActionLabel(row)}
          </Link>
        ) : null,
    },
  ];

  return (
    <TableCardView
      data={paymentAccounts}
      columns={columns}
      dataKey="id"
      loading={loading}
      initialRows={6}
      rowsPerPageOptions={[6, 12, 24]}
      title="Cuentas de cobro"
      searchPlaceholder="Buscar por estado u observaciones"
      searchFields={["estado", "observaciones", "numero"]}
      emptyMessage="No hay cuentas de cobro registradas."
      onRefresh={onRefresh}
      renderCard={(paymentAccount) => {
        const href = getPaymentAccountHref(contractId, paymentAccount.numero);
        const isHighlight = highlightNumero === paymentAccount.numero;

        return (
          <article
            className={`h-full rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
              isHighlight
                ? "border-ring/40 bg-linear-to-br from-background via-card to-ring/10"
                : "border-primary/15 bg-linear-to-br from-background via-card to-primary/5 hover:border-ring/30"
            }`}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ReceiptText className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {paymentAccount.estado}
              </span>
            </div>

            <h4 className="text-base font-black text-foreground">
              Cuenta No. {paymentAccount.numero}
            </h4>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Periodo {formatDate(paymentAccount.periodoInicio)} -{" "}
              {formatDate(paymentAccount.periodoFin)}
            </p>

            <div className="mt-5 grid gap-3 text-sm">
              <p className="rounded-2xl bg-muted/50 p-3">
                <CalendarClock className="mb-2 h-4 w-4 text-primary" />
                <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Disponible desde
                </span>
                <span className="font-semibold text-foreground">
                  {formatDate(paymentAccount.fechaHabilitadaEnvio)}
                </span>
              </p>
              <p className="rounded-2xl bg-muted/50 p-3">
                <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Valor
                </span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(paymentAccount.valor)}
                </span>
              </p>
            </div>

            <Link
              href={href}
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-ring"
            >
              {getPaymentAccountActionLabel(paymentAccount)}
            </Link>
          </article>
        );
      }}
    />
  );
}
