"use client";

import { Plus, Trash2 } from "lucide-react";
import ActionButton from "@/components/buttons/ActionButton";
import FormField from "@/components/forms/FormField";

export type ContractRubrosFieldsValue = {
  rubro: string;
  concepto: string;
  rubrosAdicionales: Array<{ rubro: string; concepto: string }>;
};

type ContractRubrosFieldsProps = {
  value: ContractRubrosFieldsValue;
  errors?: Record<string, string>;
  disabled?: boolean;
  onChange: (value: ContractRubrosFieldsValue) => void;
};

export default function ContractRubrosFields({
  value,
  errors = {},
  disabled = false,
  onChange,
}: ContractRubrosFieldsProps) {
  const updatePrincipal = (field: "rubro" | "concepto", nextValue: string) => {
    onChange({
      ...value,
      [field]: nextValue,
    });
  };

  const updateAdditional = (
    index: number,
    field: "rubro" | "concepto",
    nextValue: string
  ) => {
    onChange({
      ...value,
      rubrosAdicionales: value.rubrosAdicionales.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: nextValue } : item
      ),
    });
  };

  const addRubro = () => {
    onChange({
      ...value,
      rubrosAdicionales: [
        ...value.rubrosAdicionales,
        { rubro: "", concepto: "" },
      ],
    });
  };

  const removeRubro = (index: number) => {
    onChange({
      ...value,
      rubrosAdicionales: value.rubrosAdicionales.filter(
        (_, itemIndex) => itemIndex !== index
      ),
    });
  };

  return (
    <section className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="Rubro principal"
          name="rubro"
          value={value.rubro}
          onChange={(event) => updatePrincipal("rubro", event.target.value)}
          required
          disabled={disabled}
          helperText={errors.rubro}
        />
        <FormField
          label="Concepto principal"
          name="concepto"
          value={value.concepto}
          onChange={(event) => updatePrincipal("concepto", event.target.value)}
          required
          disabled={disabled}
          helperText={errors.concepto}
        />
      </div>

      {value.rubrosAdicionales.length > 0 ? (
        <div className="grid gap-4">
          {value.rubrosAdicionales.map((row, index) => (
            <article
              key={`rubro-adicional-${index}`}
              className="rounded-2xl border border-border/70 bg-muted/20 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">
                  Rubro adicional {index + 1}
                </p>
                <button
                  type="button"
                  onClick={() => removeRubro(index)}
                  disabled={disabled}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Eliminar rubro adicional ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  label="Rubro"
                  name={`rubrosAdicionales.${index}.rubro`}
                  value={row.rubro}
                  onChange={(event) =>
                    updateAdditional(index, "rubro", event.target.value)
                  }
                  required
                  disabled={disabled}
                  helperText={errors[`rubrosAdicionales.${index}.rubro`]}
                />
                <FormField
                  label="Concepto"
                  name={`rubrosAdicionales.${index}.concepto`}
                  value={row.concepto}
                  onChange={(event) =>
                    updateAdditional(index, "concepto", event.target.value)
                  }
                  required
                  disabled={disabled}
                  helperText={errors[`rubrosAdicionales.${index}.concepto`]}
                />
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <ActionButton
        type="button"
        variant="outline"
        icon={Plus}
        label="Agregar un nuevo rubro"
        onClick={addRubro}
        disabled={disabled}
      />
    </section>
  );
}

export function contractRubrosFromForm(
  form: ContractRubrosFieldsValue
): ContractRubrosFieldsValue {
  return {
    rubro: form.rubro.trim(),
    concepto: form.concepto.trim(),
    rubrosAdicionales: form.rubrosAdicionales.map((item) => ({
      rubro: item.rubro.trim(),
      concepto: item.concepto.trim(),
    })),
  };
}
