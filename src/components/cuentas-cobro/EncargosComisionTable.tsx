"use client";

import { Trash2 } from "lucide-react";
import ActionButton from "@/components/buttons/ActionButton";
import FormField from "@/components/forms/FormField";
import ToggleSwitch from "@/components/forms/ToggleSwitch";
import {
  MAX_ENCARGOS_COMISION,
  TIPOS_TRANSPORTE,
  type EncargoComision,
} from "@/lib/cuentas-cobro/paymentAccountReembolsables";
import type { PublicMunicipio, PublicSubregion } from "@/types/catalogos";

type EncargosComisionTableProps = {
  encargos: EncargoComision[];
  subregiones: PublicSubregion[];
  municipios: PublicMunicipio[];
  disabled?: boolean;
  onChange: (encargos: EncargoComision[]) => void;
};

function updateEncargo(
  encargos: EncargoComision[],
  index: number,
  patch: Partial<EncargoComision>
) {
  return encargos.map((item, itemIndex) =>
    itemIndex === index ? { ...item, ...patch } : item
  );
}

export default function EncargosComisionTable({
  encargos,
  subregiones,
  municipios,
  disabled = false,
  onChange,
}: EncargosComisionTableProps) {
  const canAdd = encargos.length < MAX_ENCARGOS_COMISION;

  const handleSubregionChange = (index: number, subregionId: string) => {
    const subregion = subregiones.find((item) => item.id === subregionId);
    onChange(
      updateEncargo(encargos, index, {
        subregionId,
        subregionNombre: subregion?.nombre ?? "",
        municipioId: "",
        municipioNombre: "",
      })
    );
  };

  const handleMunicipioChange = (index: number, municipioId: string) => {
    const municipio = municipios.find((item) => item.id === municipioId);
    if (!municipio) {
      onChange(
        updateEncargo(encargos, index, {
          municipioId: "",
          municipioNombre: "",
        })
      );
      return;
    }

    const subregion = subregiones.find((item) => item.id === municipio.subregionId);
    onChange(
      updateEncargo(encargos, index, {
        municipioId: municipio.id,
        municipioNombre: municipio.nombre,
        subregionId: municipio.subregionId,
        subregionNombre: subregion?.nombre ?? "",
      })
    );
  };

  const handleRemove = (index: number) => {
    onChange(encargos.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleAdd = () => {
    if (!canAdd) return;
    onChange([
      ...encargos,
      {
        id: String(encargos.length + 1).padStart(5, "0"),
        municipioId: "",
        municipioNombre: "",
        subregionId: "",
        subregionNombre: "",
        otrosDestinos: "",
        fechaSalida: "",
        fechaRegreso: "",
        pernocta: false,
        tipoTransporte: "Terrestre",
      },
    ]);
  };

  return (
    <div className="grid gap-4">
      {encargos.map((encargo, index) => {
        const municipiosFiltrados = encargo.subregionId
          ? municipios.filter((item) => item.subregionId === encargo.subregionId)
          : municipios;

        return (
          <div
            key={`${encargo.id}-${index}`}
            className="rounded-2xl border border-border/70 bg-muted/20 p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-foreground">
                Encargo {index + 1}
              </p>
              <ActionButton
                type="button"
                variant="ghost"
                icon={Trash2}
                label="Eliminar"
                onClick={() => handleRemove(index)}
                disabled={disabled || encargos.length <= 1}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Zona (subregión)"
                type="select"
                value={encargo.subregionId}
                onChange={(event) =>
                  handleSubregionChange(index, event.target.value)
                }
                options={subregiones.map((item) => ({
                  value: item.id,
                  label: item.nombre,
                }))}
                required
                disabled={disabled}
              />
              <FormField
                label="Destino (municipio)"
                type="select"
                value={encargo.municipioId}
                onChange={(event) =>
                  handleMunicipioChange(index, event.target.value)
                }
                options={municipiosFiltrados.map((item) => ({
                  value: item.id,
                  label: item.nombre,
                }))}
                required
                disabled={disabled}
              />
              <FormField
                label="Otros destinos"
                value={encargo.otrosDestinos ?? ""}
                onChange={(event) =>
                  onChange(
                    updateEncargo(encargos, index, {
                      otrosDestinos: event.target.value,
                    })
                  )
                }
                placeholder="Opcional"
                disabled={disabled}
              />
              <FormField
                label="Tipo de transporte"
                type="select"
                value={encargo.tipoTransporte}
                onChange={(event) =>
                  onChange(
                    updateEncargo(encargos, index, {
                      tipoTransporte: event.target.value as EncargoComision["tipoTransporte"],
                    })
                  )
                }
                options={TIPOS_TRANSPORTE.map((item) => ({
                  value: item,
                  label: item,
                }))}
                selectAllowEmpty={false}
                required
                disabled={disabled}
              />
              <FormField
                label="Fecha de salida"
                type="date"
                value={encargo.fechaSalida}
                onChange={(event) =>
                  onChange(
                    updateEncargo(encargos, index, {
                      fechaSalida: event.target.value,
                    })
                  )
                }
                required
                disabled={disabled}
              />
              <FormField
                label="Fecha de regreso"
                type="date"
                value={encargo.fechaRegreso}
                onChange={(event) =>
                  onChange(
                    updateEncargo(encargos, index, {
                      fechaRegreso: event.target.value,
                    })
                  )
                }
                required
                disabled={disabled}
              />
              <div className="md:col-span-2">
                <ToggleSwitch
                  label="Pernocta"
                  description="Indica si la comisión incluye pernocta."
                  value={encargo.pernocta}
                  onChange={(checked) =>
                    onChange(
                      updateEncargo(encargos, index, { pernocta: checked })
                    )
                  }
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex justify-end">
        <ActionButton
          type="button"
          variant="secondary"
          label="Agregar encargo"
          onClick={handleAdd}
          disabled={disabled || !canAdd}
        />
      </div>
    </div>
  );
}
