"use client";

import CurrencyDisplay from "@/components/ui/CurrencyDisplay";
import { parseCurrencyInputToNumber } from "@/utils/formats";

export type CurrencyFormFieldProps = {
  label: string;
  name: string;
  value: number;
  onChange: (name: string, value: number) => void;
  required?: boolean;
  helperText?: string;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  id?: string;
};

const containerClasses =
  "flex w-full items-center gap-3 border border-input rounded-xl bg-background px-4 py-3 text-base shadow-sm transition-all focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent";

const inputClasses =
  "min-w-0 flex-1 border-0 bg-transparent p-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0";

export default function CurrencyFormField({
  label,
  name,
  value,
  onChange,
  required = false,
  helperText,
  invalid = false,
  disabled = false,
  className = "",
  placeholder = "0",
  id,
}: CurrencyFormFieldProps) {
  const fieldId = id ?? name;
  const inputValue = value > 0 ? String(value) : "";

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseCurrencyInputToNumber(event.target.value);
    onChange(name, parsed);
  };

  return (
    <div className={className}>
      <label
        htmlFor={fieldId}
        className="mb-2 block text-base font-semibold text-foreground"
      >
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </label>

      <div
        className={`${containerClasses} ${disabled ? "cursor-not-allowed opacity-60" : ""} ${invalid ? "border-destructive focus-within:ring-destructive/30" : ""}`}
      >
        <input
          id={fieldId}
          name={name}
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={inputClasses}
          aria-invalid={invalid}
        />
        <CurrencyDisplay
          value={value}
          size="sm"
          emptyText="$0"
          className="shrink-0 tabular-nums text-muted-foreground"
        />
      </div>

      {helperText ? (
        <p
          className={`mt-2 text-sm ${invalid ? "text-destructive" : "text-muted-foreground"}`}
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
