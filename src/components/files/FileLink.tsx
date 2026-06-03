"use client";

import { FileText } from "lucide-react";
import type { ReactNode } from "react";

export interface FileLinkProps {
    /** URL del archivo (absoluta o relativa, ej. /api/uploads/rp/archivo.pdf o legado /uploads/...) */
    url: string;
    /** Texto a mostrar en lugar de la URL (ej. "rp-1770761017705") */
    displayName: string;
    /** Icono opcional. Por defecto FileText */
    icon?: ReactNode;
    /** Clases CSS adicionales para el enlace */
    className?: string;
}

/**
 * Enlace reutilizable que abre un archivo en una nueva pestaña.
 * Muestra displayName en lugar de la URL y construye la URL absoluta si es relativa.
 */
export default function FileLink({
    url,
    displayName,
    icon,
    className = "inline-flex items-center gap-2 text-primary hover:text-primary/80 hover:underline font-medium",
}: FileLinkProps) {
    const href =
        url.startsWith("http") || url.startsWith("//")
            ? url
            : `${typeof window !== "undefined" ? window.location.origin : ""}${url.startsWith("/") ? url : `/${url}`}`;

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
        >
            {icon ?? <FileText className="w-4 h-4 shrink-0" />}
            {displayName}
        </a>
    );
}
