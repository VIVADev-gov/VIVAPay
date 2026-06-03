import { CalendarClock, CheckCircle2 } from "lucide-react";
import type { CuentasCobroSummaryResponse } from "@/types/contratos";
import { formatDate } from "@/utils/formatters";

type PaymentAccountHeroProps = {
  summary?: CuentasCobroSummaryResponse;
  loading?: boolean;
};

export default function PaymentAccountHero({
  summary,
  loading = false,
}: PaymentAccountHeroProps) {
  const nextPayment = summary?.nextPaymentAccount;
  const lastPayment = summary?.lastPaymentAccount;

  return (
    <section className="relative overflow-hidden rounded-4xl border border-border bg-linear-to-br from-primary to-ring p-8 text-primary-foreground shadow-xl">
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10" />
      <div className="relative z-10 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary-foreground/75">
          Enviar cuenta de cobro
        </p>

        {loading ? (
          <h2 className="mt-3 text-3xl font-black">Cargando información...</h2>
        ) : summary?.completedAllPaymentAccounts ? (
          <>
            <CheckCircle2 className="mt-4 h-10 w-10" />
            <h2 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
              Todas las cuentas de cobro fueron realizadas
            </h2>
            <p className="mt-4 text-base leading-7 text-primary-foreground/85">
              {summary.message}
            </p>
          </>
        ) : nextPayment ? (
          <>
            <CalendarClock className="mt-4 h-10 w-10" />
            <h2 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
              Sigue la cuenta No. {nextPayment.numero}
            </h2>
            <p className="mt-4 text-base leading-7 text-primary-foreground/85">
              Podrás enviarla desde el{" "}
              {formatDate(nextPayment.fechaHabilitadaEnvio)}
              {nextPayment.fechaLimiteEnvio
                ? ` hasta el ${formatDate(nextPayment.fechaLimiteEnvio)}.`
                : "."}
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
              No hay cuentas pendientes
            </h2>
            <p className="mt-4 text-base leading-7 text-primary-foreground/85">
              {lastPayment
                ? `La última cuenta registrada fue la No. ${lastPayment.numero}, con estado ${lastPayment.estado}.`
                : "Cuando exista una cuenta de cobro programada, verás aquí las fechas y condiciones para enviarla."}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
