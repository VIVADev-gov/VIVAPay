"use client";

import ActionButton from "@/components/buttons/ActionButton";
import {
  canSubmitPaymentAccount,
  isPaymentAccountReadOnly,
  isPaymentAccountSubmissionWindowOpen,
} from "@/lib/cuentas-cobro/paymentAccountAccess";
import type { PublicContrato, PublicCuentaCobro } from "@/types/contratos";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { CalendarClock, ReceiptText } from "lucide-react";
import { useUiStore } from "@/store/ui/ui-store";

type PaymentAccountWorkspaceProps = {
  contract: PublicContrato;
  paymentAccount: PublicCuentaCobro;
};

export default function PaymentAccountWorkspace({
  contract,
  paymentAccount,
}: PaymentAccountWorkspaceProps) {
  const showToast = useUiStore((s) => s.showToast);
  const readOnly = isPaymentAccountReadOnly(paymentAccount);
  const canSubmit = canSubmitPaymentAccount(paymentAccount);
  const windowOpen = isPaymentAccountSubmissionWindowOpen(paymentAccount);

  const handleSubmitPlaceholder = () => {
    showToast({
      message:
        "El envío formal de la cuenta de cobro se habilitará en la siguiente iteración.",
      variant: "info",
    });
  };

  return (
    <section className="grid gap-6">
      <article className="overflow-hidden rounded-4xl border border-primary/15 bg-linear-to-br from-card via-background to-primary/5 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Cuenta de cobro
              </p>
              <h3 className="mt-1 text-2xl font-black text-foreground">
                No. {paymentAccount.numero}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Contrato {contract.actual.numeroContrato ?? contract.numeroContrato}
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {paymentAccount.estado}
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Periodo
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatDate(paymentAccount.periodoInicio)} –{" "}
              {formatDate(paymentAccount.periodoFin)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Valor
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatCurrency(paymentAccount.valor)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Disponible desde
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatDate(paymentAccount.fechaHabilitadaEnvio)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Límite de envío
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatDate(paymentAccount.fechaLimiteEnvio)}
            </p>
          </div>
        </div>

        {!windowOpen && !readOnly ? (
          <p className="mt-4 flex items-start gap-2 rounded-2xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Esta cuenta aún no está en ventana de envío o el periodo ya venció.
            Podrás gestionarla cuando corresponda según las fechas del contrato.
          </p>
        ) : null}
      </article>

      <article className="rounded-4xl border border-dashed border-primary/25 bg-linear-to-br from-background via-card to-primary/5 p-8 shadow-sm">
        <h3 className="text-xl font-black text-foreground">
          {readOnly ? "Detalle de cuenta enviada" : "Formulario de cuenta de cobro"}
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {readOnly
            ? "Esta cuenta ya fue enviada o finalizada. Aquí podrás consultar soportes y trazabilidad cuando esté disponible."
            : "Completa el formulario con soportes y validaciones. El envío formal se conectará en la siguiente iteración."}
        </p>

        {!readOnly && canSubmit ? (
          <div className="mt-6 flex justify-end">
            <ActionButton
              type="button"
              variant="primary"
              label="Enviar cuenta de cobro"
              onClick={handleSubmitPlaceholder}
            />
          </div>
        ) : null}
      </article>
    </section>
  );
}
