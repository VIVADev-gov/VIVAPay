"use client";

import FormField from "@/components/forms/FormField";
import ToggleSwitch from "@/components/forms/ToggleSwitch";
import {
  canToggleManualRegularizationAccount,
  getManualRegularizationBoundary,
  isAppSubmittedAccount,
  type ManualRegularizationAccountDisplay,
} from "@/lib/contratos/manualRegularization.shared";
import { syncManualPaymentDatesForCount } from "@/lib/contratos/manualPaymentDates.shared";
import { formatCurrency, formatDate } from "@/utils/formatters";

type ManualRegularizationAccountsFieldsProps = {
  accounts: ManualRegularizationAccountDisplay[];
  submittedCount: number;
  paymentDatesByNumero: Record<number, string | undefined>;
  boundary?: number;
  onSubmittedCountChange: (count: number) => void;
  onPaymentDatesChange: (dates: Record<number, string | undefined>) => void;
};

export default function ManualRegularizationAccountsFields({
  accounts,
  submittedCount,
  paymentDatesByNumero,
  boundary: boundaryProp,
  onSubmittedCountChange,
  onPaymentDatesChange,
}: ManualRegularizationAccountsFieldsProps) {
  const sortedAccounts = [...accounts].sort((a, b) => a.numero - b.numero);
  const boundary =
    boundaryProp ??
    getManualRegularizationBoundary(sortedAccounts);

  const setSubmittedCountFromToggle = (numero: number, checked: boolean) => {
    const nextCount = checked ? numero : Math.max(0, numero - 1);
    onSubmittedCountChange(nextCount);
    onPaymentDatesChange(
      syncManualPaymentDatesForCount(nextCount, paymentDatesByNumero)
    );
  };

  const setPaymentDate = (numero: number, value: string) => {
    onPaymentDatesChange({
      ...paymentDatesByNumero,
      [numero]: value,
    });
  };

  return (
    <div className="grid gap-3">
      {sortedAccounts.map((account) => {
        const isAppSubmitted = isAppSubmittedAccount(account);
        const checked = isAppSubmitted || account.numero <= submittedCount;
        const toggleEnabled = canToggleManualRegularizationAccount(
          account,
          boundary
        );
        const showPaymentDate =
          checked && !isAppSubmitted && account.numero <= submittedCount;

        return (
          <div
            key={account.id}
            className="rounded-2xl border border-border/60 bg-background/70 p-4"
          >
            <ToggleSwitch
              label={`Cuenta ${account.numero} — ${formatDate(
                account.periodoInicio
              )} - ${formatDate(account.periodoFin)} — ${formatCurrency(
                account.valor
              )}`}
              description={
                isAppSubmitted
                  ? "Enviada por la app"
                  : account.envioManual
                    ? "Enviada manualmente"
                    : "Pendiente"
              }
              value={checked}
              disabled={!toggleEnabled}
              onChange={(value) =>
                setSubmittedCountFromToggle(account.numero, value)
              }
            />
            {showPaymentDate ? (
              <div className="mt-3 pl-1">
                <FormField
                  label="Fecha de pago"
                  name={`fechaPago-${account.numero}`}
                  type="date"
                  value={paymentDatesByNumero[account.numero] ?? ""}
                  onChange={(event) =>
                    setPaymentDate(account.numero, event.target.value)
                  }
                  required
                  helperText="¿Cuándo te pagaron esta cuenta?"
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
