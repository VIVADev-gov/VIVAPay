"use client";

import { useEffect, useState } from "react";
import ActionButton from "@/components/buttons/ActionButton";
import FileUpload from "@/components/forms/FileUpload";
import FormField from "@/components/forms/FormField";
import ToggleSwitch from "@/components/forms/ToggleSwitch";
import Modal from "@/components/modals/Modal";
import {
  buildPlantillaMetadata,
  sanitizePlantillaInput,
  type SeguridadSocialPlantillaMetadata,
} from "@/lib/cuentas-cobro/seguridadSocialPlantilla";
import type { PublicCuentaCobroDocumento } from "@/types/contratos";

type PaymentAccountSeguridadSocialModalProps = {
  isOpen: boolean;
  onClose: () => void;
  existingDocument?: PublicCuentaCobroDocumento | null;
  disabled?: boolean;
  loading?: boolean;
  onSave: (input: {
    file: File | null;
    plantillaMetadata: SeguridadSocialPlantillaMetadata;
  }) => Promise<void>;
};

export default function PaymentAccountSeguridadSocialModal({
  isOpen,
  onClose,
  existingDocument,
  disabled = false,
  loading = false,
  onSave,
}: PaymentAccountSeguridadSocialModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [keepExistingFile, setKeepExistingFile] = useState(false);
  const [modo, setModo] = useState<"UNICO" | "SEPARADO">("UNICO");
  const [plantillaUnica, setPlantillaUnica] = useState("");
  const [plantillaPension, setPlantillaPension] = useState("");
  const [plantillaEps, setPlantillaEps] = useState("");
  const [plantillaArl, setPlantillaArl] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const metadata = existingDocument?.metadata ?? null;
    setFile(null);
    setKeepExistingFile(Boolean(existingDocument));
    setError(null);

    if (!metadata) {
      setModo("UNICO");
      setPlantillaUnica("");
      setPlantillaPension("");
      setPlantillaEps("");
      setPlantillaArl("");
      return;
    }

    if (metadata.modo === "SEPARADO") {
      setModo("SEPARADO");
      setPlantillaUnica("");
      setPlantillaPension(metadata.plantillaPension);
      setPlantillaEps(metadata.plantillaEps);
      setPlantillaArl(metadata.plantillaArl);
      return;
    }

    setModo("UNICO");
    setPlantillaUnica(metadata.plantillaPension);
    setPlantillaPension("");
    setPlantillaEps("");
    setPlantillaArl("");
  }, [isOpen, existingDocument]);

  const hasPdf = Boolean(file) || (keepExistingFile && Boolean(existingDocument));

  const handleSubmit = async () => {
    if (!hasPdf) {
      setError("Debes adjuntar el soporte en PDF");
      return;
    }

    const { metadata, error: validationError } = buildPlantillaMetadata({
      modo,
      plantillaUnica,
      plantillaPension,
      plantillaEps,
      plantillaArl,
    });

    if (validationError || !metadata) {
      setError(validationError ?? "Datos de plantilla inválidos");
      return;
    }

    setError(null);
    await onSave({
      file: file ?? null,
      plantillaMetadata: metadata,
    });
  };

  const handleSameNumberToggle = (useSameNumber: boolean) => {
    if (useSameNumber) {
      const base =
        plantillaUnica || plantillaPension || plantillaEps || plantillaArl;
      setModo("UNICO");
      setPlantillaUnica(base);
      setPlantillaPension("");
      setPlantillaEps("");
      setPlantillaArl("");
      return;
    }

    const base =
      plantillaUnica || plantillaPension || plantillaEps || plantillaArl;
    setModo("SEPARADO");
    setPlantillaUnica("");
    setPlantillaPension(base || plantillaPension);
    setPlantillaEps(base || plantillaEps);
    setPlantillaArl(base || plantillaArl);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Soporte de seguridad social"
      tamaño="lg"
    >
      <div className="grid gap-6">
        <p className="text-sm leading-6 text-muted-foreground">
          Adjunta el comprobante de pago y registra el número de plantilla. Si
          pagaste pensión, EPS y ARL en un solo comprobante, usa el mismo número
          para los tres.
        </p>

        <FileUpload
          id="seguridad-social-soporte"
          name="seguridadSocialSoporte"
          label={
            keepExistingFile && !file
              ? "PDF actual"
              : existingDocument
                ? "Reemplazar PDF"
                : "Subir PDF"
          }
          disabled={disabled || loading}
          currentFileName={
            file?.name ??
            (keepExistingFile ? existingDocument?.originalName ?? undefined : undefined)
          }
          onChange={(nextFile) => {
            setFile(nextFile);
            setKeepExistingFile(false);
            if (nextFile) setError(null);
          }}
        />

        <section className="grid gap-4 rounded-3xl border border-border/70 bg-muted/20 p-4">
          <div>
            <h4 className="text-sm font-bold text-foreground">Números de plantilla</h4>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Solo dígitos, sin espacios ni guiones.
            </p>
          </div>

          <ToggleSwitch
            label="Usar el mismo número de plantilla para la pensión, EPS y ARL"
            description="Actívalo si la pensión, EPS y ARL comparten el mismo número de plantilla."
            value={modo === "UNICO"}
            disabled={disabled || loading}
            onChange={handleSameNumberToggle}
          />

          {modo === "UNICO" ? (
            <FormField
              id="plantilla-unica"
              name="plantillaUnica"
              label="Número de plantilla"
              inputMode="numeric"
              placeholder="Ej: 2405123456"
              value={plantillaUnica}
              onChange={(event) =>
                setPlantillaUnica(sanitizePlantillaInput(event.target.value))
              }
            />
          ) : (
            <div className="grid gap-3">
              <FormField
                id="plantilla-pension"
                name="plantillaPension"
                label="Pensión"
                inputMode="numeric"
                placeholder="Número de plantilla"
                value={plantillaPension}
                onChange={(event) =>
                  setPlantillaPension(sanitizePlantillaInput(event.target.value))
                }
              />
              <FormField
                id="plantilla-eps"
                name="plantillaEps"
                label="EPS"
                inputMode="numeric"
                placeholder="Número de plantilla"
                value={plantillaEps}
                onChange={(event) =>
                  setPlantillaEps(sanitizePlantillaInput(event.target.value))
                }
              />
              <FormField
                id="plantilla-arl"
                name="plantillaArl"
                label="ARL"
                inputMode="numeric"
                placeholder="Número de plantilla"
                value={plantillaArl}
                onChange={(event) =>
                  setPlantillaArl(sanitizePlantillaInput(event.target.value))
                }
              />
            </div>
          )}
        </section>

        {error ? (
          <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <ActionButton
            type="button"
            variant="outline"
            label="Cancelar"
            onClick={onClose}
            disabled={loading}
          />
          <ActionButton
            type="button"
            variant="primary"
            label={existingDocument ? "Actualizar soporte" : "Guardar soporte"}
            loading={loading}
            disabled={disabled}
            onClick={() => void handleSubmit()}
          />
        </div>
      </div>
    </Modal>
  );
}
