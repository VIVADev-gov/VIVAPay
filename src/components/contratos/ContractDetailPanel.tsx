import type { PublicContrato } from "@/types/contratos";
import { formatCurrency, formatDate } from "@/utils/formatters";

const detailRows = [
  ["Concepto", "concepto"],
  ["Rubro", "rubro"],
  ["CDP", "cdp"],
  ["Valor CDP", "valorCdp"],
  ["RPC", "rpc"],
  ["Valor RPC", "valorRpc"],
  ["No. disponibilidad", "numeroDisponibilidad"],
  ["No. compromiso", "numeroCompromiso"],
] as const;

type ContractDetailPanelProps = {
  contract: PublicContrato;
};

export default function ContractDetailPanel({
  contract,
}: ContractDetailPanelProps) {
  const current = contract.actual;

  const getValue = (key: (typeof detailRows)[number][1]) => {
    const value = current[key] ?? contract[key];
    if (key === "valorCdp" || key === "valorRpc") {
      return formatCurrency(typeof value === "number" ? value : null);
    }
    return value ?? "Sin registrar";
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
      <div className="rounded-4xl border border-border bg-background/70 p-6 shadow-sm">
        <h3 className="text-xl font-black text-foreground">
          Detalle del contrato
        </h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {detailRows.map(([label, key]) => (
            <div key={key} className="rounded-2xl bg-muted/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {getValue(key)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-4xl border border-border bg-background/70 p-6 shadow-sm">
        <h3 className="text-xl font-black text-foreground">Modificaciones</h3>
        <div className="mt-5 grid gap-3">
          {contract.modificaciones.length > 0 ? (
            contract.modificaciones.map((modification) => (
              <article
                key={modification.id}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-foreground">
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
            ))
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              Este contrato no tiene adiciones, prórrogas o suspensiones
              registradas.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
