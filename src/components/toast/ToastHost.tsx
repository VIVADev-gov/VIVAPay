"use client";

import Toast from "@/components/toast/Toast";
import { useUiStore } from "@/store/ui/ui-store";

export default function ToastHost() {
  const toast = useUiStore((s) => s.toast);
  const hideToast = useUiStore((s) => s.hideToast);

  if (!toast) return null;

  return (
    <Toast
      open
      message={toast.message}
      variant={toast.variant}
      autoClose={toast.autoClose}
      inModal={toast.inModal}
      onClose={hideToast}
    />
  );
}
