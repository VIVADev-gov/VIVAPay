"use client";

import { useEffect, useState } from "react";
import ActionButton from "@/components/buttons/ActionButton";
import ToggleSwitch from "@/components/forms/ToggleSwitch";
import Modal from "@/components/modals/Modal";
import {
  defaultPaymentAccountDeclarations,
  type PaymentAccountDeclarations,
} from "@/lib/cuentas-cobro/paymentAccountDeclarations";

type PaymentAccountDeclarationsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialDeclarations?: PaymentAccountDeclarations | null;
  disabled?: boolean;
  onSave: (declarations: PaymentAccountDeclarations) => void;
};

export default function PaymentAccountDeclarationsModal({
  isOpen,
  onClose,
  initialDeclarations,
  disabled = false,
  onSave,
}: PaymentAccountDeclarationsModalProps) {
  const [contratoMultiplesTrabajadores, setContratoMultiplesTrabajadores] =
    useState(defaultPaymentAccountDeclarations.contratoMultiplesTrabajadores);
  const [rutActualizado, setRutActualizado] = useState(
    defaultPaymentAccountDeclarations.rutActualizado
  );

  useEffect(() => {
    if (!isOpen) return;

    setContratoMultiplesTrabajadores(
      initialDeclarations?.contratoMultiplesTrabajadores ??
        defaultPaymentAccountDeclarations.contratoMultiplesTrabajadores
    );
    setRutActualizado(
      initialDeclarations?.rutActualizado ??
        defaultPaymentAccountDeclarations.rutActualizado
    );
  }, [isOpen, initialDeclarations]);

  const handleSave = () => {
    onSave({
      contratoMultiplesTrabajadores,
      rutActualizado,
    });
    onClose();
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

        <section className="grid gap-4 rounded-3xl border border-border/70 bg-muted/20 p-4">
          <div>
            <h4 className="text-sm font-bold text-foreground">
              Retención en la fuente (artículo 383 E.T.)
            </h4>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Para efectos de la aplicación de la tabla de retención en la fuente
              establecida en el artículo 383 del Estatuto Tributario, incorporada
              por el artículo 33 del Decreto 1808 de 2019:
            </p>
          </div>

          <ToggleSwitch
            label="He contratado o vinculado más de un trabajador asociado a mi actividad económica por al menos noventa (90) días continuos o discontinuos"
            description="En el momento en que contrate o vincule más de un trabajador asociado a mi actividad económica, me comprometo a informar."
            value={contratoMultiplesTrabajadores}
            disabled={disabled}
            onChange={setContratoMultiplesTrabajadores}
          />
        </section>

        <section className="grid gap-4 rounded-3xl border border-border/70 bg-muted/20 p-4">
          <div>
            <h4 className="text-sm font-bold text-foreground">
              Actualización del RUT
            </h4>
          </div>

          <ToggleSwitch
            label="Declaro que a la fecha de presentación de este documento, mi RUT se encuentra actualizado"
            value={rutActualizado}
            disabled={disabled}
            onChange={setRutActualizado}
          />
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <ActionButton
            type="button"
            variant="outline"
            label="Cancelar"
            onClick={onClose}
            disabled={disabled}
          />
          <ActionButton
            type="button"
            variant="primary"
            label={initialDeclarations ? "Actualizar declaraciones" : "Guardar declaraciones"}
            disabled={disabled}
            onClick={handleSave}
          />
        </div>
      </div>
    </Modal>
  );
}
