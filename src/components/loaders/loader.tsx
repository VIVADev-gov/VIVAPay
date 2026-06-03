import { BRAND_COLORS } from "@/constants/theme";

const sizeClasses = {
  sm: "h-5 w-5",
  md: "h-10 w-10",
  lg: "h-14 w-14",
} as const;

export type LoaderBrandColor = keyof typeof BRAND_COLORS;

export type LoaderProps = {
  className?: string;
  size?: keyof typeof sizeClasses;
  /** Color del arco según paleta de marca (`BRAND_COLORS`). Si no se indica, usa `text-primary` del tema. */
  brandColor?: LoaderBrandColor;
  /** Spinner claro para fondos oscuros o muy saturados (ignora `brandColor`). */
  onSolidBackground?: boolean;
  /** Texto para lectores de pantalla */
  label?: string;
};

/** Spinner circular (pista suave + arco). Color de marca o tema. */
export function Loader({
  className,
  size = "md",
  brandColor,
  onSolidBackground,
  label = "Cargando",
}: LoaderProps) {
  const strokeColor = onSolidBackground
    ? "#ffffff"
    : brandColor
      ? BRAND_COLORS[brandColor]
      : undefined;

  const svgClass =
    onSolidBackground || brandColor
      ? "h-full w-full animate-spin text-current"
      : "h-full w-full animate-spin text-primary";

  return (
    <span
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      className={["inline-flex shrink-0 items-center justify-center", sizeClasses[size], className]
        .filter(Boolean)
        .join(" ")}
    >
      <svg
        className={svgClass}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        style={strokeColor ? { color: strokeColor } : undefined}
      >
        <circle
          className="stroke-current opacity-20"
          cx="12"
          cy="12"
          r="10"
          strokeWidth="2.5"
        />
        <circle
          className="stroke-current"
          cx="12"
          cy="12"
          r="10"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="18 45"
          transform="rotate(-90 12 12)"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
