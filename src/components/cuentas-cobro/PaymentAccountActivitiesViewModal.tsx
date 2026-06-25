"use client";

import PaymentAccountActivitiesList from "@/components/cuentas-cobro/PaymentAccountActivitiesList";
import Modal from "@/components/modals/Modal";
import type { PublicCuentaCobroActividadItem } from "@/types/contratos";

type PaymentAccountActivitiesViewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  activities: PublicCuentaCobroActividadItem[];
};

export default function PaymentAccountActivitiesViewModal({
  isOpen,
  onClose,
  activities,
}: PaymentAccountActivitiesViewModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Actividades de la cuenta de cobro"
      tamaño="full"
    >
      <PaymentAccountActivitiesList activities={activities} showSummary={false} />
    </Modal>
  );
}
