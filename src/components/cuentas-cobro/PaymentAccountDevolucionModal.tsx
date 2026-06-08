"use client";

import { useState } from "react";
import Modal from "@/components/modals/Modal";
import ActionButton from "@/components/buttons/ActionButton";
import FormField from "@/components/forms/FormField";

type PaymentAccountDevolucionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mensaje: string) => Promise<void>;
  loading?: boolean;
  title?: string;
};

export default function PaymentAccountDevolucionModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  title = "Devolver cuenta al contratista",
}: PaymentAccountDevolucionModalProps) {
  const [mensaje, setMensaje] = useState("");

  const handleClose = () => {
    setMensaje("");
    onClose();
  };

  const handleConfirm = async () => {
    await onConfirm(mensaje.trim());
    setMensaje("");
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} tamaño="md">
      <div className="grid gap-5">
        <p className="text-sm leading-6 text-muted-foreground">
          Indica qué debe corregir el contratista. Este mensaje quedará en el
          historial de la cuenta.
        </p>
        <FormField
          label="Mensaje de devolución"
          name="mensaje"
          type="textarea"
          value={mensaje}
          onChange={(event) => setMensaje(event.target.value)}
          required
          rows={5}
        />
        <div className="flex justify-end gap-3">
          <ActionButton
            type="button"
            variant="outline"
            label="Cancelar"
            onClick={handleClose}
            disabled={loading}
          />
          <ActionButton
            type="button"
            variant="danger"
            label="Devolver cuenta"
            loading={loading}
            disabled={!mensaje.trim()}
            onClick={() => void handleConfirm()}
          />
        </div>
      </div>
    </Modal>
  );
}
