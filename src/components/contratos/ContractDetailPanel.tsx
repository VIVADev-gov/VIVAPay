"use client";

import { useContratosStore } from "@/store/contratos/contratos.store";
import { formatCurrency, formatDate } from "@/utils/formatters";

const detailRows = [
  ["Concepto principal", "concepto"],
  ["Rubro principal", "rubro"],
  [
    "Certificado de disponibilidad presupuestal (CDP)",
    "cdp",
  ],
  [
    "Valor certificado de disponibilidad presupuestal (CDP)",
    "valorCdp",
  ],
  ["Registro presupuestal del compromiso (RCP)", "rpc"],
  [
    "Valor registro presupuestal del compromiso (RCP)",
    "valorRpc",
  ],
] as const;

export default function ContractDetailPanel() {
  const contract = useContratosStore((s) => s.detail?.contract ?? null);

  if (!contract) {
    return null;
  }

  const current = contract.actual;
  const rubrosAdicionales = contract.rubrosAdicionales ?? [];

  const getValue = (key: (typeof detailRows)[number][1]) => {
    const value = current[key] ?? contract[key];
    if (key === "valorCdp" || key === "valorRpc") {
      return formatCurrency(typeof value === "number" ? value : null);
    }
    return value ?? "Sin registrar";
  };

  const historialOrdenado = [...(contract.historialEdiciones ?? [])].sort(
    (a, b) =>
      new Date(b.fecha ?? 0).getTime() - new Date(a.fecha ?? 0).getTime()
  );

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
          {rubrosAdicionales.map((item, index) => (
            <div
              key={`rubro-adicional-${index}`}
              className="rounded-2xl bg-muted/50 p-4 md:col-span-2"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Rubro adicional {index + 1}
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {item.rubro} · {item.concepto}
              </p>
            </div>
          ))}
          {contract.tieneReembolsables ? (
            <>
              <div className="rounded-2xl bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Rubro reembolsable
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {contract.rubroRembolsable ?? "Sin registrar"}
                </p>
              </div>
              <div className="rounded-2xl bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Concepto reembolsable
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {contract.conceptoRembolsable ?? "Sin registrar"}
                </p>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6">
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

        <div className="rounded-4xl border border-border bg-background/70 p-6 shadow-sm">
          <h3 className="text-xl font-black text-foreground">
            Historial de ediciones
          </h3>
          <div className="mt-5 grid gap-3">
            {historialOrdenado.length > 0 ? (
              historialOrdenado.map((entry, index) => (
                <article
                  key={entry.id ?? entry.fecha ?? `historial-${index}`}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-bold text-foreground">{entry.userName}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(entry.fecha)}
                    </span>
                  </div>
                  <ul className="mt-3 grid gap-2">
                    {(entry.cambios ?? []).map((change) => (
                      <li
                        key={`${entry.id ?? index}-${change.campo}`}
                        className="rounded-xl bg-muted/40 px-3 py-2 text-sm leading-6 text-muted-foreground"
                      >
                        <span className="font-semibold text-foreground">
                          {change.etiqueta}:
                        </span>{" "}
                        {change.valorAnterior ?? "—"} →{" "}
                        {change.valorNuevo ?? "—"}
                      </li>
                    ))}
                  </ul>
                </article>
              ))
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                Aún no hay ediciones registradas sobre este contrato.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
