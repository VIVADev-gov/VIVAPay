import type { ElementType } from "react";
import { AlertCircle, CheckCircle2, Inbox, Info, RefreshCw } from "lucide-react";
import ActionButton from "@/components/buttons/ActionButton";

export type EmptyStateVariant =
  | "default"
  | "empty"
  | "error"
  | "loading"
  | "success"
  | "info";

export interface EmptyStateProps {
  message?: string;
  description?: string;
  onRefresh?: () => void;
  showRefreshButton?: boolean;
  refreshButtonText?: string;
  icon?: "inbox" | "alert" | "refresh" | "success" | "info";
  variant?: EmptyStateVariant;
  className?: string;
}

const iconByKey: Record<NonNullable<EmptyStateProps["icon"]>, ElementType> = {
  inbox: Inbox,
  alert: AlertCircle,
  refresh: RefreshCw,
  success: CheckCircle2,
  info: Info,
};

const defaultIconByVariant: Record<EmptyStateVariant, NonNullable<EmptyStateProps["icon"]>> = {
  default: "inbox",
  empty: "inbox",
  error: "alert",
  loading: "refresh",
  success: "success",
  info: "info",
};

const containerByVariant: Record<EmptyStateVariant, string> = {
  default:
    "border-border/70 bg-linear-to-br from-card via-background to-primary/5 text-foreground",
  empty:
    "border-primary/15 bg-linear-to-br from-card via-background to-primary/5 text-foreground",
  error:
    "border-destructive/30 bg-linear-to-br from-destructive/5 via-background to-destructive/10 text-foreground",
  loading:
    "border-ring/20 bg-linear-to-br from-card via-background to-ring/5 text-foreground",
  success:
    "border-primary/20 bg-linear-to-br from-primary/5 via-background to-primary/10 text-foreground",
  info: "border-ring/25 bg-linear-to-br from-ring/5 via-background to-card text-foreground",
};

const iconWrapByVariant: Record<EmptyStateVariant, string> = {
  default: "bg-muted text-muted-foreground ring-muted/50",
  empty: "bg-primary/10 text-primary ring-primary/15",
  error: "bg-destructive/10 text-destructive ring-destructive/20",
  loading: "bg-ring/10 text-ring ring-ring/20",
  success: "bg-primary/10 text-primary ring-primary/20",
  info: "bg-ring/10 text-ring ring-ring/20",
};

const titleByVariant: Record<EmptyStateVariant, string> = {
  default: "text-foreground",
  empty: "text-foreground",
  error: "text-destructive",
  loading: "text-foreground",
  success: "text-primary",
  info: "text-ring",
};

const buttonVariantByState: Record<
  EmptyStateVariant,
  "primary" | "outline" | "danger" | "ghost"
> = {
  default: "primary",
  empty: "primary",
  error: "danger",
  loading: "outline",
  success: "primary",
  info: "outline",
};

export default function EmptyState({
  message = "No hay datos disponibles",
  description,
  onRefresh,
  showRefreshButton = true,
  refreshButtonText = "Recargar",
  icon,
  variant = "default",
  className = "",
}: EmptyStateProps) {
  const resolvedIcon = icon ?? defaultIconByVariant[variant];
  const IconComponent = iconByKey[resolvedIcon];
  const isLoadingVariant = variant === "loading";

  return (
    <section
      className={`relative flex w-full flex-col items-center justify-center overflow-hidden rounded-3xl border p-8 text-center shadow-sm ${containerByVariant[variant]} ${className}`}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/5"
        aria-hidden="true"
      />

      <div
        className={`relative mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl ring-4 ${iconWrapByVariant[variant]}`}
      >
        <IconComponent
          className={`h-8 w-8 ${isLoadingVariant ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
      </div>

      <h3 className={`relative text-lg font-semibold tracking-tight ${titleByVariant[variant]}`}>
        {message}
      </h3>

      {description ? (
        <p className="relative mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}

      {showRefreshButton && onRefresh ? (
        <ActionButton
          variant={buttonVariantByState[variant]}
          label={refreshButtonText}
          onClick={onRefresh}
          icon={RefreshCw}
          className="relative mt-6"
        />
      ) : null}
    </section>
  );
}
