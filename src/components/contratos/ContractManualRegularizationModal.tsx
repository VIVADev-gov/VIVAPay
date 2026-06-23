"use client";

import { useEffect, useMemo, useState } from "react";
import ActionButton from "@/components/buttons/ActionButton";
import ToggleSwitch from "@/components/forms/ToggleSwitch";
import Modal from "@/components/modals/Modal";
import { useUpdateManualRegularizationMutation } from "@/hooks/api/useContratos";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  canToggleManualRegularizationAccount,
  getManualRegularizationBoundary,
  isAppSubmittedAccount,
} from "@/lib/contratos/manualRegularization.shared";
import { useUiStore } from "@/store/ui/ui-store";
import type { PublicCuentaCobro } from "@/types/contratos";
import { formatCurrency, formatDate } from "@/utils/formatters";

type ContractManualRegularizationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  paymentAccounts: PublicCuentaCobro[];
};

function countManualAccounts(paymentAccounts: PublicCuentaCobro[]) {
  return paymentAccounts.filter((account) => account.envioManual).length;
}

export default function ContractManualRegularizationModal({
  isOpen,
  onClose,
  contractId,
  paymentAccounts,
}: ContractManualRegularizationModalProps) {
  const showToast = useUiStore((s) => s.showToast);
  const updateMutation = useUpdateManualRegularizationMutation(contractId);
  const sortedAccounts = useMemo(
    () => [...paymentAccounts].sort((a, b) => a.numero - b.numero),
    [paymentAccounts]
  );
  const boundary = useMemo(
    () => getManualRegularizationBoundary(sortedAccounts),
    [sortedAccounts]
  );
  const [submittedCount, setSubmittedCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setSubmittedCount(countManualAccounts(sortedAccounts));
    }
  }, [isOpen, sortedAccounts]);

  const setSubmittedCountFromToggle = (numero: number, checked: boolean) => {
    setSubmittedCount(checked ? numero : Math.max(0, numero - 1));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (submittedCount > boundary) {
      showToast({
        message:
          "No puedes marcar más cuentas porque ya hay cuentas enviadas por la app",
        variant: "warning",
      });
      return;
    }

    try {
      await updateMutation.mutateAsync({
        submittedPaymentAccountsCount: submittedCount,
      });
      showToast({
        message: "Regularización manual actualizada correctamente",
        variant: "success",
      });
      onClose();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(
          error,
          "No se pudo actualizar la regularización manual"
        ),
        variant: "error",
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar cuentas enviadas manualmente"
      tamaño="lg"
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Marca en orden las cuentas que ya enviaste fuera de la app. Solo
          puedes editar cuentas manuales o pendientes antes de la primera cuenta
          enviada por la app.
        </p>

        <div className="grid gap-3">
          {sortedAccounts.map((account) => {
            const isAppSubmitted = isAppSubmittedAccount(account);
            const checked =
              isAppSubmitted || account.numero <= submittedCount;
            const toggleEnabled = canToggleManualRegularizationAccount(
              account,
              boundary
            );

            return (
              <ToggleSwitch
                key={account.id}
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
            );
          })}
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <ActionButton
            type="button"
            variant="outline"
            label="Cancelar"
            onClick={onClose}
          />
          <ActionButton
            type="submit"
            variant="primary"
            label={
              updateMutation.isPending ? "Guardando..." : "Guardar cambios"
            }
            loading={updateMutation.isPending}
          />
        </div>
      </form>
    </Modal>
  );
}
