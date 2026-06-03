"use client";

import Modal from "@/components/modals/Modal";
import { useUiStore } from "@/store/ui/ui-store";

export default function ModalHost() {
  const modal = useUiStore((s) => s.modal);
  const closeModal = useUiStore((s) => s.closeModal);

  return (
    <Modal
      isOpen={modal.isOpen}
      onClose={closeModal}
      title={modal.title}
      tamaño={modal.tamaño}
      canClose={modal.canClose}
    >
      {modal.content}
    </Modal>
  );
}
