import { Loader2 } from "lucide-react";

const sizeClasses = {
  sm: "h-5 w-5",
  md: "h-10 w-10",
  lg: "h-14 w-14",
} as const;

const variantClasses = {
  primary: "text-primary",
  muted: "text-muted-foreground",
} as const;

export type LoaderProps = {
  className?: string;
  size?: keyof typeof sizeClasses;
  /** Alineado al resto de la app: `primary` (por defecto) o `muted` como en facturación / cuenta de cobro. */
  variant?: keyof typeof variantClasses;
  /** Icono claro para fondos oscuros o muy saturados. */
  onSolidBackground?: boolean;
  /** Texto para lectores de pantalla */
  label?: string;
};

/** Spinner de carga (mismo patrón que `Loader2` + `animate-spin` en el proyecto). */
export function Loader({
  className,
  size = "md",
  variant = "primary",
  onSolidBackground,
  label = "Cargando",
}: LoaderProps) {
  const colorClass = onSolidBackground ? "text-white" : variantClasses[variant];

  return (
    <span
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      className={["inline-flex shrink-0 items-center justify-center", sizeClasses[size]]
        .filter(Boolean)
        .join(" ")}
    >
      <Loader2
        aria-hidden
        className={["h-full w-full animate-spin", colorClass, className].filter(Boolean).join(" ")}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
