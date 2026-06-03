import { CalendarDays, FileText } from "lucide-react";
import type { PublicContrato } from "@/types/contratos";
import { formatCurrency, formatDate } from "@/utils/formatters";

type ContractHeroProps = {
  contract: PublicContrato | null;
  title?: string;
};

export default function ContractHero({
  contract,
  title = "Información contractual",
}: ContractHeroProps) {
  if (!contract) {
    return (
      <section className="rounded-4xl border border-border bg-linear-to-br from-primary to-ring p-8 text-primary-foreground shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary-foreground/75">
          {title}
        </p>
        <h2 className="mt-3 text-3xl font-black">Sin contratos registrados</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-primary-foreground/85">
          Cuando exista un contrato relacionado con tu usuario, aparecerá aquí
          como contrato actual o último contrato registrado.
        </p>
      </section>
    );
  }

  const current = contract.actual;

  return (
    <section className="relative overflow-hidden rounded-4xl border border-border bg-linear-to-br from-primary to-ring p-8 text-primary-foreground shadow-xl">
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10" />
      <div className="relative z-10">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary-foreground/75">
          {title}
        </p>
        <h2 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
          Contrato No. {current.numeroContrato ?? contract.numeroContrato}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-primary-foreground/85">
          {current.objeto ?? contract.objeto}
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white/10 p-4">
            <CalendarDays className="mb-3 h-5 w-5" />
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/70">
              Fecha final
            </p>
            <p className="mt-1 font-bold">
              {formatDate(current.fechaFinal ?? contract.fechaFinal)}
            </p>
          </div>
          <div className="rounded-3xl bg-white/10 p-4">
            <FileText className="mb-3 h-5 w-5" />
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/70">
              Plazo
            </p>
            <p className="mt-1 font-bold">
              {current.plazoMeses ?? contract.plazoMeses} meses
            </p>
          </div>
          <div className="rounded-3xl bg-white/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/70">
              Recursos comprometidos
            </p>
            <p className="mt-3 font-bold">
              {formatCurrency(current.totalRecursosComprometidos)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
