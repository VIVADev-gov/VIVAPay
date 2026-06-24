"use client";

import { useEffect, useState } from "react";
import ActionButton from "@/components/buttons/ActionButton";
import ToggleSwitch from "@/components/forms/ToggleSwitch";
import Modal from "@/components/modals/Modal";
import {
  defaultPaymentAccountDeclarations,
  PAYMENT_ACCOUNT_DECLARATION_ITEMS,
  type PaymentAccountDeclarations,
} from "@/lib/cuentas-cobro/paymentAccountDeclarations";

type PaymentAccountDeclarationsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialDeclarations?: PaymentAccountDeclarations | null;
  disabled?: boolean;
  onSave: (declarations: PaymentAccountDeclarations) => void | Promise<void>;
  loading?: boolean;
};

export default function PaymentAccountDeclarationsModal({
  isOpen,
  onClose,
  initialDeclarations,
  disabled = false,
  onSave,
  loading = false,
}: PaymentAccountDeclarationsModalProps) {
  const [declarations, setDeclarations] = useState(
    defaultPaymentAccountDeclarations
  );

  useEffect(() => {
    if (!isOpen) return;

    setDeclarations({
      contratoMultiplesTrabajadores:
        initialDeclarations?.contratoMultiplesTrabajadores ??
        defaultPaymentAccountDeclarations.contratoMultiplesTrabajadores,
      rutActualizado:
        initialDeclarations?.rutActualizado ??
        defaultPaymentAccountDeclarations.rutActualizado,
    });
  }, [isOpen, initialDeclarations]);

  const handleSave = async () => {
    await onSave(declarations);
  };

  const updateDeclaration = (
    key: keyof PaymentAccountDeclarations,
    value: boolean
  ) => {
    setDeclarations((current) => ({ ...current, [key]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Declaraciones juradas"
      tamaño="lg"
    >
      <div className="grid gap-6">
        <p className="text-sm leading-6 text-muted-foreground">
          Manifiesta bajo la gravedad de juramento la información requerida para
          la cuenta de cobro del periodo.
        </p>

        {PAYMENT_ACCOUNT_DECLARATION_ITEMS.map((item) => (
          <section
            key={item.key}
            className="grid gap-4 rounded-3xl border border-border/70 bg-muted/20 p-4"
          >
            <div>
              <h4 className="text-sm font-bold text-foreground">
                {item.number}. {item.title}
              </h4>
              {item.intro ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.intro}
                </p>
              ) : null}
            </div>

            <ToggleSwitch
              label={item.statement}
              description={item.commitment}
              statusLabels={item.statusLabels}
              value={declarations[item.key]}
              disabled={disabled || loading}
              onChange={(value) => updateDeclaration(item.key, value)}
            />
          </section>
        ))}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <ActionButton
            type="button"
            variant="outline"
            label="Cancelar"
            onClick={onClose}
            disabled={disabled || loading}
          />
          <ActionButton
            type="button"
            variant="primary"
            label={initialDeclarations ? "Actualizar declaraciones" : "Guardar declaraciones"}
            loading={loading}
            disabled={disabled}
            onClick={() => void handleSave()}
          />
        </div>
      </div>
    </Modal>
  );
}
