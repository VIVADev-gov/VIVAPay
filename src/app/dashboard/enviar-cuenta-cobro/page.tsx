"use client";

import { CalendarClock, CheckCircle2 } from "lucide-react";
import { DashboardHero } from "@/components/dashboard";
import { ModuleCreateButton } from "@/components/contratos";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useCuentasCobroSummaryQuery } from "@/hooks/api/useCuentasCobro";
import { useCuentasCobroStore } from "@/store/cuentas-cobro/cuentas-cobro.store";
import { useUiStore } from "@/store/ui/ui-store";
import { formatDate } from "@/utils/formatters";

export default function EnviarCuentaCobroPage() {
  useCuentasCobroSummaryQuery();
  const nextPayment = useCuentasCobroStore((s) => s.nextPaymentAccount);
  const lastPayment = useCuentasCobroStore((s) => s.lastPaymentAccount);
  const completedAll = useCuentasCobroStore((s) => s.completedAllPaymentAccounts);
  const summaryMessage = useCuentasCobroStore((s) => s.summaryMessage);
  const currentContract = useCuentasCobroStore((s) => s.currentContract);
  const isLoading = useCuentasCobroStore((s) => s.isLoadingSummary);
  const showToast = useUiStore((s) => s.showToast);

  const canCreatePayment =
    Boolean(nextPayment) &&
    (currentContract?.canSubmitPaymentAccount ?? true) &&
    !completedAll;

  const handleCreatePayment = () => {
    showToast({
      message:
        "El formulario de envío de cuenta de cobro se habilitará en la siguiente iteración.",
      variant: "info",
    });
  };

  const heroTitle = isLoading
    ? "Cargando información..."
    : completedAll
      ? "Todas las cuentas de cobro realizadas"
      : nextPayment
        ? `Sigue la cuenta No. ${nextPayment.numero}`
        : "No hay cuentas pendientes";

  const heroDescription = isLoading
    ? "Estamos consultando el estado de tus cuentas de cobro."
    : completedAll
      ? (summaryMessage ??
        "Ya completaste todas las cuentas de cobro registradas para tu contrato.")
      : nextPayment
        ? `Podrás enviarla desde el ${formatDate(nextPayment.fechaHabilitadaEnvio)}${
            nextPayment.fechaLimiteEnvio
              ? ` hasta el ${formatDate(nextPayment.fechaLimiteEnvio)}`
              : ""
          }.`
        : lastPayment
          ? `La última cuenta registrada fue la No. ${lastPayment.numero}, con estado ${lastPayment.estado}.`
          : "Cuando exista una cuenta programada, verás aquí las fechas y condiciones para enviarla.";

  return (
    <DashboardLayout title="Enviar cuenta de cobro">
      <section className="grid gap-8">
        <DashboardHero
          eyebrow="Enviar cuenta de cobro"
          title={heroTitle}
          description={heroDescription}
        >
          {!isLoading && completedAll ? (
            <CheckCircle2 className="h-10 w-10 text-primary-foreground/90" />
          ) : !isLoading && nextPayment ? (
            <CalendarClock className="h-10 w-10 text-primary-foreground/90" />
          ) : null}
        </DashboardHero>

        <div className="flex justify-end">
          <ModuleCreateButton
            label="Enviar cuenta de cobro"
            onClick={handleCreatePayment}
            disabled={!canCreatePayment}
          />
        </div>

        <section className="grid gap-5 md:grid-cols-2">
          <article className="overflow-hidden rounded-4xl border border-primary/15 bg-linear-to-br from-card via-background to-primary/5 p-6 shadow-sm">
            <h3 className="text-lg font-black text-foreground">Cuenta que sigue</h3>
            {nextPayment ? (
              <div className="mt-4 grid gap-3 text-sm">
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Número
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {nextPayment.numero}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Periodo
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {formatDate(nextPayment.periodoInicio)} -{" "}
                    {formatDate(nextPayment.periodoFin)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Disponible desde
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {formatDate(nextPayment.fechaHabilitadaEnvio)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {completedAll
                  ? "Ya realizaste todas las cuentas de cobro. Solo puedes consultar el detalle."
                  : "No hay una cuenta de cobro pendiente para enviar."}
              </p>
            )}
          </article>

          <article className="overflow-hidden rounded-4xl border border-border/80 bg-linear-to-br from-card via-background to-muted/20 p-6 shadow-sm">
            <h3 className="text-lg font-black text-foreground">Última cuenta</h3>
            {lastPayment ? (
              <div className="mt-4 grid gap-3 text-sm">
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Número
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {lastPayment.numero}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Estado
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {lastPayment.estado}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Fecha de envío
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {formatDate(lastPayment.fechaEnvio)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Aún no hay una cuenta enviada o finalizada.
              </p>
            )}
          </article>
        </section>

        <section className="rounded-4xl border border-dashed border-primary/25 bg-linear-to-br from-background via-card to-primary/5 p-8 text-center shadow-sm">
          <h3 className="text-xl font-black text-foreground">
            Formulario de cuenta de cobro
          </h3>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Este espacio queda preparado para desarrollar el formulario de envío
            con soportes, validaciones y generación documental.
          </p>
        </section>
      </section>
    </DashboardLayout>
  );
}
