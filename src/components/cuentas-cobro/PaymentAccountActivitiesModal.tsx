"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import ActionButton from "@/components/buttons/ActionButton";
import FileLink from "@/components/files/FileLink";
import Modal from "@/components/modals/Modal";
import {
  type SaveCuentaCobroActivityItem,
  useSaveCuentaCobroActivitiesMutation,
} from "@/hooks/api/useCuentasCobro";
import type {
  CuentaCobroActividadSoporteTipo,
  PublicCuentaCobroActividadItem,
} from "@/types/contratos";

type ActivityRow = {
  localId: string;
  orden: number;
  actividad: string;
  accion: string;
  soporteTipo: CuentaCobroActividadSoporteTipo;
  soporteTexto: string;
  soporteArchivoPath: string | null;
  soporteArchivoNombre: string | null;
  file: File | null;
  ejecucion: number;
};

type PaymentAccountActivitiesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  numeroCuenta: number;
  initialActivities: PublicCuentaCobroActividadItem[];
  onSaved?: () => void;
};

function makeLocalId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function newRow(orden: number): ActivityRow {
  return {
    localId: makeLocalId(),
    orden,
    actividad: "",
    accion: "",
    soporteTipo: "TEXTO",
    soporteTexto: "",
    soporteArchivoPath: null,
    soporteArchivoNombre: null,
    file: null,
    ejecucion: 100,
  };
}

function toRow(activity: PublicCuentaCobroActividadItem): ActivityRow {
  return {
    localId: activity.id ?? makeLocalId(),
    orden: activity.orden,
    actividad: activity.actividad,
    accion: activity.accion,
    soporteTipo: activity.soporteTipo,
    soporteTexto: activity.soporteTexto ?? "",
    soporteArchivoPath: activity.soporteArchivoPath,
    soporteArchivoNombre: activity.soporteArchivoNombre,
    file: null,
    ejecucion: activity.ejecucion ?? 100,
  };
}

function normalizeRows(rows: ActivityRow[]): ActivityRow[] {
  return rows.map((row, index) => ({ ...row, orden: index + 1 }));
}

export default function PaymentAccountActivitiesModal({
  isOpen,
  onClose,
  contractId,
  numeroCuenta,
  initialActivities,
  onSaved,
}: PaymentAccountActivitiesModalProps) {
  const saveMutation = useSaveCuentaCobroActivitiesMutation(
    contractId,
    numeroCuenta
  );
  const [rows, setRows] = useState<ActivityRow[]>(() =>
    initialActivities.length > 0
      ? initialActivities
          .slice()
          .sort((a, b) => a.orden - b.orden)
          .map(toRow)
      : [newRow(1)]
  );
  const [error, setError] = useState<string | null>(null);

  const setRow = (localId: string, patch: Partial<ActivityRow>) => {
    setRows((current) =>
      current.map((row) => (row.localId === localId ? { ...row, ...patch } : row))
    );
  };

  const addRow = () => {
    setRows((current) => [...current, newRow(current.length + 1)]);
  };

  const removeRow = (localId: string) => {
    setRows((current) => {
      if (current.length === 1) return current;
      return normalizeRows(current.filter((row) => row.localId !== localId));
    });
  };

  const validateRows = () => {
    for (const row of rows) {
      if (!row.actividad.trim()) return `La actividad ${row.orden} es obligatoria.`;
      if (!row.accion.trim()) return `La acción ${row.orden} es obligatoria.`;
      if (row.ejecucion < 0 || row.ejecucion > 100) {
        return `La ejecución de la actividad ${row.orden} debe estar entre 0 y 100.`;
      }
      if (row.soporteTipo === "TEXTO" && !row.soporteTexto.trim()) {
        return `El soporte de texto de la actividad ${row.orden} es obligatorio.`;
      }
      if (
        row.soporteTipo === "ARCHIVO" &&
        !row.file &&
        !row.soporteArchivoPath
      ) {
        return `Debes adjuntar soporte para la actividad ${row.orden}.`;
      }
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateRows();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload: SaveCuentaCobroActivityItem[] = normalizeRows(rows).map(
      (row) => ({
        orden: row.orden,
        actividad: row.actividad.trim(),
        accion: row.accion.trim(),
        soporteTipo: row.soporteTipo,
        soporteTexto:
          row.soporteTipo === "TEXTO" ? row.soporteTexto.trim() : null,
        ejecucion: Number(row.ejecucion),
        file: row.file,
      })
    );

    await saveMutation.mutateAsync(payload);
    onSaved?.();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Actividades de la cuenta de cobro"
      tamaño="fullscreen"
      canClose={!saveMutation.isPending}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-3xl border border-primary/15 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">
          Registra actividades, acciones, soporte y porcentaje de ejecución. Las
          filas se pueden editar en cualquier momento; si una actividad usa
          soporte por archivo, puedes reemplazarlo subiendo uno nuevo.
        </div>

        {error ? (
          <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            {error}
          </p>
        ) : null}

        <div className="overflow-x-auto rounded-3xl border border-border/80 bg-background/80 shadow-sm">
          <table className="min-w-[1100px] w-full border-collapse text-sm">
            <thead className="bg-muted/60 text-left text-xs font-black uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-[22%] px-4 py-3">Actividades</th>
                <th className="w-[28%] px-4 py-3">Acciones</th>
                <th className="w-[32%] px-4 py-3">Soporte</th>
                <th className="w-[12%] px-4 py-3">Ejecución</th>
                <th className="w-[6%] px-4 py-3 text-center"> </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.localId} className="border-t border-border/70">
                  <td className="align-top px-4 py-3">
                    <textarea
                      value={row.actividad}
                      onChange={(event) =>
                        setRow(row.localId, { actividad: event.target.value })
                      }
                      placeholder="Ej. SOSTENIBILIDAD"
                      className="min-h-24 w-full rounded-2xl border border-border bg-background px-3 py-2 font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </td>
                  <td className="align-top px-4 py-3">
                    <textarea
                      value={row.accion}
                      onChange={(event) =>
                        setRow(row.localId, { accion: event.target.value })
                      }
                      placeholder="Describe las acciones realizadas"
                      className="min-h-24 w-full rounded-2xl border border-border bg-background px-3 py-2 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </td>
                  <td className="align-top px-4 py-3">
                    <div className="space-y-3">
                      <select
                        value={row.soporteTipo}
                        onChange={(event) =>
                          setRow(row.localId, {
                            soporteTipo: event.target
                              .value as CuentaCobroActividadSoporteTipo,
                            soporteTexto: "",
                            file: null,
                          })
                        }
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="TEXTO">Texto</option>
                        <option value="ARCHIVO">Archivo</option>
                      </select>

                      {row.soporteTipo === "TEXTO" ? (
                        <textarea
                          value={row.soporteTexto}
                          onChange={(event) =>
                            setRow(row.localId, {
                              soporteTexto: event.target.value,
                            })
                          }
                          placeholder="Describe el soporte de esta actividad"
                          className="min-h-20 w-full rounded-2xl border border-border bg-background px-3 py-2 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      ) : (
                        <div className="space-y-2 rounded-2xl border border-dashed border-border bg-muted/20 p-3">
                          {row.soporteArchivoPath ? (
                            <FileLink
                              url={row.soporteArchivoPath}
                              displayName={
                                row.soporteArchivoNombre ?? "Soporte cargado"
                              }
                            />
                          ) : null}
                          {row.file ? (
                            <p className="text-xs font-semibold text-primary">
                              Nuevo archivo: {row.file.name}
                            </p>
                          ) : null}
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                            onChange={(event) =>
                              setRow(row.localId, {
                                file: event.target.files?.[0] ?? null,
                              })
                            }
                            className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-bold file:text-primary-foreground"
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="align-top px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={row.ejecucion}
                        onChange={(event) =>
                          setRow(row.localId, {
                            ejecucion: Number(event.target.value),
                          })
                        }
                        className="w-20 rounded-xl border border-border bg-background px-3 py-2 text-right font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <span className="font-bold text-muted-foreground">%</span>
                    </div>
                  </td>
                  <td className="align-top px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(row.localId)}
                      disabled={rows.length === 1}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Eliminar actividad"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <ActionButton
            type="button"
            variant="outline"
            icon={Plus}
            label="Agregar fila"
            onClick={addRow}
          />
          <div className="flex flex-col gap-3 md:flex-row md:justify-end">
            <ActionButton
              type="button"
              variant="ghost"
              label="Cancelar"
              onClick={onClose}
              disabled={saveMutation.isPending}
            />
            <ActionButton
              type="submit"
              variant="primary"
              label="Guardar actividades"
              loading={saveMutation.isPending}
              loaderLabel="Guardando"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
