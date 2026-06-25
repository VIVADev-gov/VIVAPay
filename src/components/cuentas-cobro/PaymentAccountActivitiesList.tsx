"use client";

import FileLink from "@/components/files/FileLink";
import type { PublicCuentaCobroActividadItem } from "@/types/contratos";

type PaymentAccountActivitiesListProps = {
  activities: PublicCuentaCobroActividadItem[];
  showSummary?: boolean;
};

export function getPaymentAccountActivitiesStats(
  activities: PublicCuentaCobroActividadItem[]
) {
  const sortedActivities = [...activities].sort((a, b) => a.orden - b.orden);

  if (sortedActivities.length === 0) {
    return {
      count: 0,
      averageExecution: null as number | null,
      fileSupportCount: 0,
    };
  }

  return {
    count: sortedActivities.length,
    averageExecution: Math.round(
      sortedActivities.reduce((sum, activity) => sum + activity.ejecucion, 0) /
        sortedActivities.length
    ),
    fileSupportCount: sortedActivities.filter(
      (activity) => activity.soporteTipo === "ARCHIVO"
    ).length,
  };
}

function ActivitySupportCell({
  activity,
}: {
  activity: PublicCuentaCobroActividadItem;
}) {
  if (activity.soporteTipo === "ARCHIVO") {
    if (!activity.soporteArchivoPath) {
      return (
        <span className="text-sm text-muted-foreground">Sin archivo adjunto</span>
      );
    }

    return (
      <FileLink
        url={activity.soporteArchivoPath}
        displayName={activity.soporteArchivoNombre ?? "Soporte cargado"}
      />
    );
  }

  if (!activity.soporteTexto?.trim()) {
    return <span className="text-sm text-muted-foreground">Sin soporte</span>;
  }

  return (
    <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
      {activity.soporteTexto}
    </p>
  );
}

export default function PaymentAccountActivitiesList({
  activities,
  showSummary = true,
}: PaymentAccountActivitiesListProps) {
  const sortedActivities = [...activities].sort((a, b) => a.orden - b.orden);

  if (sortedActivities.length === 0) {
    return (
      <p className="text-sm leading-6 text-muted-foreground">
        Sin actividades registradas.
      </p>
    );
  }

  const { averageExecution, fileSupportCount } =
    getPaymentAccountActivitiesStats(sortedActivities);

  return (
    <div className="grid gap-4">
      {showSummary ? (
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Actividades
            </p>
            <p className="mt-1 text-2xl font-black text-foreground">
              {sortedActivities.length}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Ejecución promedio
            </p>
            <p className="mt-1 text-2xl font-black text-foreground">
              {averageExecution}%
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Soportes por archivo
            </p>
            <p className="mt-1 text-2xl font-black text-foreground">
              {fileSupportCount}
            </p>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-3xl border border-border/80 bg-background/80 shadow-sm">
        <table className="min-w-[960px] w-full border-collapse text-sm">
          <thead className="bg-muted/60 text-left text-xs font-black uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-[6%] px-4 py-3">#</th>
              <th className="w-[22%] px-4 py-3">Actividades</th>
              <th className="w-[28%] px-4 py-3">Acciones</th>
              <th className="w-[32%] px-4 py-3">Soporte</th>
              <th className="w-[12%] px-4 py-3">Ejecución</th>
            </tr>
          </thead>
          <tbody>
            {sortedActivities.map((activity) => (
              <tr key={activity.id ?? activity.orden} className="border-t border-border/70">
                <td className="align-top px-4 py-3 font-semibold text-foreground">
                  {activity.orden}
                </td>
                <td className="align-top px-4 py-3">
                  <p className="whitespace-pre-wrap font-semibold leading-6 text-foreground">
                    {activity.actividad}
                  </p>
                </td>
                <td className="align-top px-4 py-3">
                  <p className="whitespace-pre-wrap leading-6 text-foreground">
                    {activity.accion}
                  </p>
                </td>
                <td className="align-top px-4 py-3">
                  <ActivitySupportCell activity={activity} />
                </td>
                <td className="align-top px-4 py-3">
                  <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                    {activity.ejecucion}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
