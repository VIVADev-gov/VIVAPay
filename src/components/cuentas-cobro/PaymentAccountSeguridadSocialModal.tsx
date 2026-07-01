"use client";

import { useEffect, useMemo, useState } from "react";
import ActionButton from "@/components/buttons/ActionButton";
import CurrencyFormField from "@/components/forms/CurrencyFormField";
import FileUpload from "@/components/forms/FileUpload";
import FormField from "@/components/forms/FormField";
import ToggleSwitch from "@/components/forms/ToggleSwitch";
import Modal from "@/components/modals/Modal";
import {
  buildPlantillaMetadata,
  hasSeguridadSocialAportesManuales,
  parseSeguridadSocialPlantillaMetadata,
  sanitizePlantillaInput,
  type SeguridadSocialAportes,
  type SeguridadSocialPlantillaMetadata,
} from "@/lib/cuentas-cobro/seguridadSocialPlantilla";
import { computeGfrFo17SeguridadSocialAportes } from "@/lib/forms/excel/build/buildGfrFo17SeguridadSocial";
import { getGfrFo17Config } from "@/lib/forms/excel/config/gfrFo17.config";
import type { PublicCuentaCobroDocumento } from "@/types/contratos";
import { formatCurrency } from "@/utils/formatters";

type PaymentAccountSeguridadSocialModalProps = {
  isOpen: boolean;
  onClose: () => void;
  valorCuenta: number;
  existingDocument?: PublicCuentaCobroDocumento | null;
  disabled?: boolean;
  loading?: boolean;
  onSave: (input: {
    file: File | null;
    plantillaMetadata: SeguridadSocialPlantillaMetadata;
  }) => Promise<void>;
};

function formatPct(value: number) {
  return `${(value * 100).toFixed(2).replace(/\.?0+$/, "")}%`;
}

function aportesMatchSuggested(
  current: SeguridadSocialAportes,
  suggested: SeguridadSocialAportes
) {
  return (
    current.aporteSalud === suggested.aporteSalud &&
    current.aportePension === suggested.aportePension &&
    current.aporteArl === suggested.aporteArl
  );
}

export default function PaymentAccountSeguridadSocialModal({
  isOpen,
  onClose,
  valorCuenta,
  existingDocument,
  disabled = false,
  loading = false,
  onSave,
}: PaymentAccountSeguridadSocialModalProps) {
  const gfrFo17Config = useMemo(() => getGfrFo17Config(), []);
  const suggestedAportes = useMemo(
    () => computeGfrFo17SeguridadSocialAportes(valorCuenta, gfrFo17Config),
    [valorCuenta, gfrFo17Config]
  );

  const [file, setFile] = useState<File | null>(null);
  const [keepExistingFile, setKeepExistingFile] = useState(false);
  const [modo, setModo] = useState<"UNICO" | "SEPARADO">("UNICO");
  const [plantillaUnica, setPlantillaUnica] = useState("");
  const [plantillaPension, setPlantillaPension] = useState("");
  const [plantillaEps, setPlantillaEps] = useState("");
  const [plantillaArl, setPlantillaArl] = useState("");
  const [aporteSalud, setAporteSalud] = useState(0);
  const [aportePension, setAportePension] = useState(0);
  const [aporteArl, setAporteArl] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const currentAportes = useMemo(
    () => ({ aporteSalud, aportePension, aporteArl }),
    [aporteSalud, aportePension, aporteArl]
  );
  const usesManualAportes = !aportesMatchSuggested(currentAportes, {
    aporteSalud: suggestedAportes.aporteSalud,
    aportePension: suggestedAportes.aportePension,
    aporteArl: suggestedAportes.aporteArl,
  });

  useEffect(() => {
    if (!isOpen) return;

    const metadata = parseSeguridadSocialPlantillaMetadata(
      existingDocument?.metadata ?? null
    );
    setFile(null);
    setKeepExistingFile(Boolean(existingDocument));
    setError(null);

    const initialAportes = (() => {
      if (metadata && hasSeguridadSocialAportesManuales(metadata)) {
        return metadata.aportesManuales!;
      }
      return {
        aporteSalud: suggestedAportes.aporteSalud,
        aportePension: suggestedAportes.aportePension,
        aporteArl: suggestedAportes.aporteArl,
      };
    })();

    setAporteSalud(initialAportes.aporteSalud);
    setAportePension(initialAportes.aportePension);
    setAporteArl(initialAportes.aporteArl);

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
  }, [isOpen, existingDocument, suggestedAportes]);

  const hasPdf = Boolean(file) || (keepExistingFile && Boolean(existingDocument));

  const handleCurrencyChange = (name: string, value: number) => {
    if (name === "aporteSalud") setAporteSalud(value);
    if (name === "aportePension") setAportePension(value);
    if (name === "aporteArl") setAporteArl(value);
  };

  const handleRestoreSuggested = () => {
    setAporteSalud(suggestedAportes.aporteSalud);
    setAportePension(suggestedAportes.aportePension);
    setAporteArl(suggestedAportes.aporteArl);
  };

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
      useAportesManuales: usesManualAportes,
      aporteSalud,
      aportePension,
      aporteArl,
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

        <section className="grid gap-4 rounded-3xl border border-border/70 bg-muted/20 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Valores de aporte (GFR-FO-17)
              </h4>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Calculamos los aportes a partir del valor de la cuenta. Puedes
                ajustarlos si tu planilla PILA muestra valores distintos.
              </p>
            </div>
            {usesManualAportes ? (
              <ActionButton
                type="button"
                variant="outline"
                label="Restaurar sugerido"
                disabled={disabled || loading}
                onClick={handleRestoreSuggested}
              />
            ) : null}
          </div>

          <div className="grid gap-2 rounded-2xl border border-border/60 bg-background/80 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">Valor de la cuenta</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(valorCuenta)}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">IBC (40% cuenta o SMMLV)</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(suggestedAportes.ibc)}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">% base sobre valor cuenta</span>
              <span className="font-semibold text-foreground">
                {formatPct(suggestedAportes.pctBaseValorCuenta)}
              </span>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Tasas: salud {formatPct(gfrFo17Config.aporteSalud)}, pensión{" "}
              {formatPct(gfrFo17Config.aportePension)}, ARL{" "}
              {formatPct(gfrFo17Config.aporteArl)}. Redondeo PILA al centenar
              superior.
            </p>
          </div>

          {usesManualAportes ? (
            <p className="text-xs font-medium text-amber-700">
              Valores personalizados: se guardarán tal como los indicaste.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Los valores sugeridos se usarán automáticamente en el GFR-FO-17.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <CurrencyFormField
              id="aporte-salud"
              name="aporteSalud"
              label="Salud"
              value={aporteSalud}
              required
              disabled={disabled || loading}
              onChange={handleCurrencyChange}
            />
            <CurrencyFormField
              id="aporte-pension"
              name="aportePension"
              label="Pensión"
              value={aportePension}
              required
              disabled={disabled || loading}
              onChange={handleCurrencyChange}
            />
            <CurrencyFormField
              id="aporte-arl"
              name="aporteArl"
              label="ARL"
              value={aporteArl}
              required
              disabled={disabled || loading}
              onChange={handleCurrencyChange}
            />
          </div>
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
