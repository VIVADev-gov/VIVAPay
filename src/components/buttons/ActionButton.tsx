import React, { ReactNode, MouseEvent, ButtonHTMLAttributes, ElementType } from "react";
import { Loader } from "@/components/ui/loader";

export interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Para mostrar `loading` mientras una petición termina: o bien el padre pasa `loading`
   * actualizado en el mismo tick síncrono del clic (p. ej. `setState` y luego `void (async () => { ... })()`),
   * o bien `onClick` async y el padre controla `loading` con estado que se ponga antes del primer `await`.
   */
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  icon?: ElementType<{ size?: number; className?: string }>;
  label?: ReactNode;
  variant?: "primary" | "secondary" | "accent" | "danger" | "outline" | "ghost" | "success";
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  className?: string;
  disabled?: boolean;
  /** Muestra spinner, deshabilita el botón y sustituye el icono hasta que termine la acción. */
  loading?: boolean;
  /** Etiqueta accesible del spinner (por defecto "Cargando"). */
  loaderLabel?: string;
  children?: ReactNode;
}

const variants: Record<string, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg",
  secondary:
    "bg-white border-2 border-border/20 text-foreground hover:border-border/40 hover:bg-card shadow-sm",
  accent: "bg-gradient-to-r from-accent to-accent/90 text-accent-foreground hover:shadow-lg",
  danger:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-0 shadow-lg hover:shadow-destructive/25",
  outline:
    "border-2 border-border/30 text-foreground hover:bg-card hover:border-border/50",
  ghost: "text-foreground hover:bg-card hover:text-primary",
  success: "bg-green-500 text-white hover:bg-green-600 hover:shadow-green-400/20",
};

function loaderSolidBackground(variant: string): boolean {
  return ["primary", "danger", "success", "accent"].includes(variant);
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  icon: Icon,
  label,
  variant = "primary",
  type = "button",
  className = "",
  disabled = false,
  loading = false,
  loaderLabel = "Cargando",
  children,
  ...rest
}) => {
  const isBusy = disabled || loading;

  return (
    <button
      onClick={onClick}
      type={type}
      disabled={isBusy}
      className={`
        flex items-center justify-center px-4 py-3 rounded-xl font-semibold text-sm
        transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group
        ${loading ? "cursor-wait opacity-100" : "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"}
        ${variants[variant] ?? variants.primary} ${className}
      `}
      aria-busy={loading}
      {...rest}
    >
      {loading ? (
        <span className={label || children ? "mr-2 inline-flex shrink-0" : "inline-flex shrink-0"}>
          <Loader
            size="sm"
            label={loaderLabel}
            onSolidBackground={loaderSolidBackground(variant)}
            className={loaderSolidBackground(variant) ? undefined : "text-current"}
          />
        </span>
      ) : (
        Icon && (
          <Icon
            size={20}
            className={`${
              label || children ? "mr-2" : ""
            } ${isBusy ? "" : "group-hover:rotate-12"} transition-transform duration-300`}
          />
        )
      )}
      {label}
      {children}
    </button>
  );
};

export default ActionButton;
