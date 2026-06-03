"use client";

import { Plus } from "lucide-react";
import ActionButton from "@/components/buttons/ActionButton";

type ModuleCreateButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export default function ModuleCreateButton({
  label,
  onClick,
  disabled = false,
}: ModuleCreateButtonProps) {
  return (
    <ActionButton
      type="button"
      variant="primary"
      label={label}
      icon={Plus}
      onClick={onClick}
      disabled={disabled}
      className="shrink-0"
    />
  );
}
