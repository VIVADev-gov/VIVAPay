"use client";

import React, { useEffect } from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastProps {
    message: string;
    variant?: ToastVariant;
    open: boolean;
    onClose: () => void;
    /** Auto cerrar después de N ms. Si no se pasa, no se cierra automáticamente. */
    autoClose?: number;
    className?: string;
    /** Si es true, el Toast se muestra por encima de cualquier modal activo. */
    inModal?: boolean;
}

const variantStyles: Record<
    ToastVariant,
    { container: string; icon: React.ElementType }
> = {
    success: {
        container: "bg-white/95 border-green-500/50 text-green-800 shadow-green-500/10",
        icon: CheckCircle,
    },
    error: {
        container: "bg-white/95 border-destructive/50 text-destructive shadow-destructive/10",
        icon: XCircle,
    },
    info: {
        container: "bg-white/95 border-blue-500/50 text-blue-700 shadow-blue-500/10",
        icon: Info,
    },
    warning: {
        container: "bg-white/95 border-amber-500/50 text-amber-800 shadow-amber-500/10",
        icon: AlertTriangle,
    },
};

export default function Toast({
    message,
    variant = "info",
    open,
    onClose,
    autoClose,
    className = "",
    inModal = false,
}: ToastProps) {
    const { container, icon: Icon } = variantStyles[variant];

    useEffect(() => {
        if (!open || !autoClose) return;
        const timer = setTimeout(onClose, autoClose);
        return () => clearTimeout(timer);
    }, [open, autoClose, onClose]);

    if (!open) return null;

    return (
        <div
            role="alert"
            className={`fixed ${inModal ? "top-6 right-6 z-[100000000000001]" : "top-20 right-4 z-[99999999999999]"} max-w-md w-full sm:w-auto flex items-center gap-4 px-5 py-4 rounded-2xl border backdrop-blur-md shadow-2xs animate-in slide-in-from-top-5 fade-in duration-300 ${container} ${className}`}
        >
            <Icon className="w-5 h-5 shrink-0" aria-hidden />
            <p className="font-medium flex-1">{message}</p>
            <button
                type="button"
                onClick={onClose}
                className="shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Cerrar"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
