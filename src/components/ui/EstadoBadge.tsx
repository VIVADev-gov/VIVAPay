"use client";

const ESTADO_LABELS: Record<string, string> = {
    CATALOGO_ACTIVO: "Activa",
    CATALOGO_INACTIVO: "Inactiva",
    PENDIENTE_DEPARTAMENTO: "Pendiente Gobernación",
    PENDIENTE_VIVA: "Pendiente de Viva",
    APROBADA_VIVA: "Aprobada Viva",
    RECHAZADA_DEPARTAMENTO: "Rechazada Gobernación",
    RECHAZADA_VIVA: "Rechazada Viva",
    EN_TRAMITE: "En trámite",
    PREPARANDO: "Preparando",
    EN_TRANSITO: "En tránsito",
    ENTREGADO: "Entregado",
    RECIBIDO: "Recibido",
    COMPLETADO: "Completado",
};

type Variant = "pendiente" | "rechazada" | "aprobada" | "completado" | "neutral";

const ESTADO_VARIANT: Record<string, Variant> = {
    CATALOGO_ACTIVO: "completado",
    CATALOGO_INACTIVO: "neutral",
    PENDIENTE_DEPARTAMENTO: "pendiente",
    PENDIENTE_VIVA: "pendiente",
    APROBADA_VIVA: "aprobada",
    RECHAZADA_DEPARTAMENTO: "rechazada",
    RECHAZADA_VIVA: "rechazada",
    EN_TRAMITE: "aprobada",
    PREPARANDO: "aprobada",
    EN_TRANSITO: "aprobada",
    ENTREGADO: "aprobada",
    RECIBIDO: "aprobada",
    COMPLETADO: "completado",
};

const VARIANT_CLASSES: Record<Variant, string> = {
    pendiente: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40",
    rechazada: "bg-red-500/15 text-red-700 border-red-500/30 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/40",
    aprobada: "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/40",
    completado: "bg-green-500/15 text-green-700 border-green-500/30 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/40",
    neutral: "bg-muted text-muted-foreground border-border",
};

interface EstadoBadgeProps {
    estado: string;
    className?: string;
}

/** Clave para `EstadoBadge` según `status` de catálogo (API: A, ACTIVE, ACTIVO, etc.). */
export function catalogStatusToEstadoKey(status?: string | null): string {
    const normalized = (status ?? "").trim().toUpperCase();
    if (normalized === "A" || normalized === "ACTIVE" || normalized === "ACTIVO") {
        return "CATALOGO_ACTIVO";
    }
    return "CATALOGO_INACTIVO";
}

export function EstadoBadge({ estado, className = "" }: EstadoBadgeProps) {
    const label = ESTADO_LABELS[estado] ?? estado;
    const variant = ESTADO_VARIANT[estado] ?? "neutral";
    const variantClasses = VARIANT_CLASSES[variant];
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variantClasses} ${className}`}
        >
            {label}
        </span>
    );
}

export { ESTADO_LABELS };
