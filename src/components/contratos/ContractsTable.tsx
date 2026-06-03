"use client";

import { CalendarDays, FileText, ReceiptText } from "lucide-react";
import Link from "next/link";
import {
  TableCardView,
  type DataTableColumnConfig,
} from "@/components/table";
import type { PublicContrato } from "@/types/contratos";
import { formatCurrency, formatDate } from "@/utils/formatters";

type ContractsTableProps = {
  contracts: PublicContrato[];
  loading?: boolean;
  onRefresh?: () => void;
};

export default function ContractsTable({
  contracts,
  loading = false,
  onRefresh,
}: ContractsTableProps) {
  const columns: DataTableColumnConfig<PublicContrato>[] = [
    {
      field: "numeroContrato",
      header: "No. contrato",
      sortable: true,
      body: (row) => (
        <span className="font-semibold text-foreground">
          {row.actual.numeroContrato ?? row.numeroContrato}
        </span>
      ),
    },
    {
      field: "fechaActaInicio",
      header: "Inicio",
      sortable: true,
      body: (row) =>
        formatDate(row.actual.fechaActaInicio ?? row.fechaActaInicio),
    },
    {
      field: "fechaFinal",
      header: "Fecha final",
      sortable: true,
      body: (row) => formatDate(row.actual.fechaFinal ?? row.fechaFinal),
    },
    {
      field: "valorInicialContrato",
      header: "Valor",
      align: "right",
      body: (row) =>
        formatCurrency(
          row.actual.totalRecursosComprometidos ?? row.valorInicialContrato
        ),
    },
    {
      field: "paymentAccountCount",
      header: "Cuentas",
      align: "center",
      body: (row) => (
        <span className="font-semibold text-primary">
          {row.paymentAccountCount ?? 0}
        </span>
      ),
    },
    {
      field: "id",
      header: "Acciones",
      align: "center",
      body: (row) => (
        <Link
          href={`/dashboard/informacion-contractual/${row.id}`}
          className="inline-flex rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
        >
          Ver detalle
        </Link>
      ),
    },
  ];

  return (
    <TableCardView
      data={contracts}
      columns={columns}
      dataKey="id"
      loading={loading}
      initialRows={6}
      rowsPerPageOptions={[6, 12, 24]}
      title="Contratos"
      searchPlaceholder="Buscar por número, concepto o rubro"
      searchFields={[
        "numeroContrato",
        "concepto",
        "rubro",
        "actual.numeroContrato",
      ]}
      emptyMessage="No hay contratos registrados."
      onRefresh={onRefresh}
      renderCard={(contract) => (
        <article className="h-full rounded-3xl border border-primary/15 bg-linear-to-br from-background via-card to-primary/5 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-ring/30 hover:shadow-lg">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                contract.vigente
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {contract.vigente ? "Vigente" : "Histórico"}
            </span>
          </div>

          <h4 className="text-base font-black text-foreground">
            Contrato No. {contract.actual.numeroContrato ?? contract.numeroContrato}
          </h4>

          <div className="mt-5 grid gap-3 text-sm">
            <p className="rounded-2xl border border-border/60 bg-muted/40 p-3">
              <CalendarDays className="mb-2 h-4 w-4 text-primary" />
              <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Inicio
              </span>
              <span className="font-semibold text-foreground">
                {formatDate(contract.actual.fechaActaInicio ?? contract.fechaActaInicio)}
              </span>
            </p>
            <p className="rounded-2xl border border-border/60 bg-muted/40 p-3">
              <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Fecha final
              </span>
              <span className="font-semibold text-foreground">
                {formatDate(contract.actual.fechaFinal ?? contract.fechaFinal)}
              </span>
            </p>
            <p className="rounded-2xl border border-border/60 bg-muted/40 p-3">
              <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Valor
              </span>
              <span className="font-semibold text-foreground">
                {formatCurrency(
                  contract.actual.totalRecursosComprometidos ??
                    contract.valorInicialContrato
                )}
              </span>
            </p>
            <p className="rounded-2xl border border-primary/15 bg-primary/5 p-3">
              <ReceiptText className="mb-2 h-4 w-4 text-primary" />
              <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cuentas de cobro
              </span>
              <span className="font-semibold text-foreground">
                {contract.paymentAccountCount ?? 0} registradas
                {contract.submittedPaymentAccountCount != null
                  ? ` · ${contract.submittedPaymentAccountCount} enviadas`
                  : ""}
              </span>
            </p>
          </div>

          <Link
            href={`/dashboard/informacion-contractual/${contract.id}`}
            className="mt-5 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-ring"
          >
            Ver detalle
          </Link>
        </article>
      )}
    />
  );
}
