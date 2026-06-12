"use client";

import { useState, type ReactNode } from "react";
import type {
  PaymentAccountReviewContractor,
  PublicContrato,
} from "@/types/contratos";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { ChevronDown, ChevronUp } from "lucide-react";

type PaymentAccountReviewContextPanelProps = {
  contract: PublicContrato;
  contractor: PaymentAccountReviewContractor;
  collapsible?: boolean;
};

const budgetRows = [
  ["Concepto", "concepto"],
  ["Rubro", "rubro"],
  ["CDP", "cdp"],
  ["Valor CDP", "valorCdp"],
  ["RPC", "rpc"],
  ["Valor RPC", "valorRpc"],
  ["No. disponibilidad", "numeroDisponibilidad"],
  ["No. compromiso", "numeroCompromiso"],
] as const;

function ContextSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-border/50 px-6 py-5 last:border-b-0">
      <h3 className="text-xs font-bold uppercase tracking-wide text-primary">
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FieldCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-foreground">{value}</p>
    </div>
  );
}

function FieldGrid({
  items,
}: {
  items: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <FieldCard key={label} label={label} value={value} />
      ))}
    </div>
  );
}

function ContractObject({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 180;

  return (
    <div>
      <p
        className={`text-sm leading-7 text-foreground ${!expanded && isLong ? "line-clamp-3" : ""}`}
      >
        {text}
      </p>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-2 text-sm font-semibold text-primary hover:underline"
        >
          {expanded ? "Ver menos" : "Ver más"}
        </button>
      ) : null}
    </div>
  );
}

function ContextPanelContent({
  contract,
  contractor,
}: {
  contract: PublicContrato;
  contractor: PaymentAccountReviewContractor;
}) {
  const current = contract.actual;
  const [modificationsExpanded, setModificationsExpanded] = useState(false);

  const contractorItems = [
    ["Nombre", contractor.name],
    ["Documento", contractor.documentId],
    ["Correo", contractor.email],
    ["Área", contractor.organizationalUnitName || "Sin registrar"],
    ["Subárea", contractor.subareaName || "Sin registrar"],
  ] as const;

  const budgetItems = budgetRows.map(([label, key]) => {
    const value = current[key] ?? contract[key];
    const formatted =
      key === "valorCdp" || key === "valorRpc"
        ? formatCurrency(typeof value === "number" ? value : null)
        : (value ?? "Sin registrar");
    return [label, String(formatted)] as const;
  });

  const visibleModifications =
    modificationsExpanded || contract.modificaciones.length <= 2
      ? contract.modificaciones
      : contract.modificaciones.slice(0, 2);

  return (
    <>
      <ContextSection title="Contratista">
        <FieldGrid items={contractorItems} />
      </ContextSection>

      <ContextSection title="Contrato">
        <p className="mb-4 text-sm font-semibold text-muted-foreground">
          No. {current.numeroContrato ?? contract.numeroContrato}
        </p>
        <ContractObject text={current.objeto ?? contract.objeto} />
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Plazo
            </p>
            <p className="mt-2 text-sm font-bold text-foreground">
              {current.plazoMeses ?? contract.plazoMeses} meses
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Fecha final
            </p>
            <p className="mt-2 text-sm font-bold text-foreground">
              {formatDate(current.fechaFinal ?? contract.fechaFinal)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Recursos
            </p>
            <p className="mt-2 text-sm font-bold text-foreground">
              {formatCurrency(current.totalRecursosComprometidos)}
            </p>
          </div>
        </div>
      </ContextSection>

      <ContextSection title="Presupuesto">
        <FieldGrid items={budgetItems} />
      </ContextSection>

      <ContextSection title="Modificaciones">
        {contract.modificaciones.length === 0 ? (
          <p className="text-sm leading-6 text-muted-foreground">
            Sin adiciones, prórrogas o suspensiones registradas.
          </p>
        ) : (
          <div className="space-y-3">
            {visibleModifications.map((modification) => (
              <article
                key={modification.id}
                className="rounded-2xl border border-border/60 bg-muted/20 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-foreground">
                    {modification.tipo}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(modification.fechaRegistro)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {modification.descripcion ??
                    "Modificación registrada sobre el contrato."}
                </p>
              </article>
            ))}
            {contract.modificaciones.length > 2 ? (
              <button
                type="button"
                onClick={() => setModificationsExpanded((value) => !value)}
                className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                {modificationsExpanded ? (
                  <>
                    Ver menos
                    <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Ver {contract.modificaciones.length - 2} más
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
            ) : null}
          </div>
        )}
      </ContextSection>
    </>
  );
}

export default function PaymentAccountReviewContextPanel({
  contract,
  contractor,
  collapsible = false,
}: PaymentAccountReviewContextPanelProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const panel = (
    <div className="rounded-4xl border border-border/80 bg-card shadow-sm">
      <div className="border-b border-border/50 px-6 py-5">
        <h2 className="text-base font-black text-foreground">Contexto contractual</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Contratista y contrato asociados a esta cuenta.
        </p>
      </div>
      <ContextPanelContent contract={contract} contractor={contractor} />
    </div>
  );

  if (!collapsible) {
    return (
      <aside className="lg:sticky lg:top-24 lg:self-start">{panel}</aside>
    );
  }

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="flex w-full items-center justify-between rounded-3xl border border-border/80 bg-card p-5 text-left shadow-sm"
        >
          <span>
            <span className="block text-base font-black text-foreground">
              Contexto contractual
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {contractor.name} · Contrato{" "}
              {contract.actual.numeroContrato ?? contract.numeroContrato}
            </span>
          </span>
          {mobileOpen ? (
            <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
          )}
        </button>
        {mobileOpen ? <div className="mt-4">{panel}</div> : null}
      </div>
      <div className="hidden lg:block">{panel}</div>
    </aside>
  );
}
