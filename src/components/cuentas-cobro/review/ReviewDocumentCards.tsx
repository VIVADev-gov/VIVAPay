import FileLink from "@/components/files/FileLink";
import { formatDocumentDisplayName } from "@/lib/cuentas-cobro/paymentAccountReadiness";
import { formatSeguridadSocialPlantillaSummary } from "@/lib/cuentas-cobro/seguridadSocialPlantilla";
import type { PublicCuentaCobroDocumento } from "@/types/contratos";

export function ReviewDocumentCard({
  document,
  required,
}: {
  document: PublicCuentaCobroDocumento;
  required?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">
          {formatDocumentDisplayName(document)}
        </p>
        {required ? (
          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold uppercase text-primary">
            Requerido
          </span>
        ) : null}
      </div>
      {document.metadata ? (
        <p className="mt-2 text-xs font-semibold text-muted-foreground">
          {formatSeguridadSocialPlantillaSummary(document.metadata)}
        </p>
      ) : null}
      <div className="mt-3">
        <FileLink
          url={document.filePath}
          displayName={formatDocumentDisplayName(document)}
        />
      </div>
    </div>
  );
}

export function ReviewDocumentPlaceholder({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-destructive/30 bg-destructive/5 p-4 md:p-5">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-xs text-destructive">No adjuntado</p>
    </div>
  );
}
