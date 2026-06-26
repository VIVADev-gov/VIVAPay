"use client";

import { useEffect, useMemo, useState } from "react";
import ActionButton from "@/components/buttons/ActionButton";
import ManualRegularizationAccountsFields from "@/components/contratos/ManualRegularizationAccountsFields";
import Modal from "@/components/modals/Modal";
import { useUpdateManualRegularizationMutation } from "@/hooks/api/useContratos";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  getManualRegularizationBoundary,
} from "@/lib/contratos/manualRegularization.shared";
import {
  buildManualPaymentDatesPayload,
  validateManualPaymentDatesClient,
} from "@/lib/contratos/manualPaymentDates.shared";
import { useUiStore } from "@/store/ui/ui-store";
import type { PublicCuentaCobro } from "@/types/contratos";

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
  const [paymentDatesByNumero, setPaymentDatesByNumero] = useState<
    Record<number, string | undefined>
  >({});

  useEffect(() => {
    if (!isOpen) return;

    const initialCount = countManualAccounts(sortedAccounts);
    setSubmittedCount(initialCount);
    const initialDates: Record<number, string | undefined> = {};
    for (const account of sortedAccounts) {
      if (account.numero <= initialCount && account.fechaPago) {
        initialDates[account.numero] = account.fechaPago.slice(0, 10);
      }
    }
    setPaymentDatesByNumero(initialDates);
  }, [isOpen, sortedAccounts]);

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

    const datesError = validateManualPaymentDatesClient(
      submittedCount,
      paymentDatesByNumero
    );
    if (datesError) {
      showToast({ message: datesError, variant: "warning" });
      return;
    }

    try {
      await updateMutation.mutateAsync({
        submittedPaymentAccountsCount: submittedCount,
        manualPaymentDates: buildManualPaymentDatesPayload(
          submittedCount,
          paymentDatesByNumero
        ),
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
          Marca en orden las cuentas que ya enviaste fuera de la app e indica
          cuándo te pagaron cada una.
        </p>

        <ManualRegularizationAccountsFields
          accounts={sortedAccounts}
          submittedCount={submittedCount}
          paymentDatesByNumero={paymentDatesByNumero}
          boundary={boundary}
          onSubmittedCountChange={setSubmittedCount}
          onPaymentDatesChange={setPaymentDatesByNumero}
        />

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
