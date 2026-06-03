"use client";

import React from "react";
import { formatCurrency } from "@/utils/formats";

interface CurrencyDisplayProps {
    /**
     * Valor numérico a formatear como moneda
     * Puede ser un número o string que represente un número
     */
    value: number | string | null | undefined;
    
    /**
     * Clase CSS adicional para el contenedor
     */
    className?: string;
    
    /**
     * Si es true, muestra el valor en negrita
     */
    bold?: boolean;
    
    /**
     * Si es true, muestra el valor en color primario
     */
    primary?: boolean;
    
    /**
     * Si es true, muestra el valor en color secundario
     */
    secondary?: boolean;
    
    /**
     * Si es true, muestra el valor en color de éxito
     */
    success?: boolean;
    
    /**
     * Si es true, muestra el valor en color de error
     */
    error?: boolean;
    
    /**
     * Tamaño del texto: 'sm' | 'base' | 'lg' | 'xl' | '2xl'
     */
    size?: "sm" | "base" | "lg" | "xl" | "2xl";
    
    /**
     * Texto a mostrar si el valor es null, undefined o 0
     */
    emptyText?: string;
}

/**
 * Componente para mostrar valores numéricos formateados como moneda colombiana (COP)
 * 
 * @example
 * <CurrencyDisplay value={50000} />
 * // Muestra: $50.000
 * 
 * @example
 * <CurrencyDisplay value={1000000} bold primary size="lg" />
 * // Muestra: $1.000.000 (en negrita, color primario, tamaño grande)
 */
export default function CurrencyDisplay({
    value,
    className = "",
    bold = false,
    primary = false,
    secondary = false,
    success = false,
    error = false,
    size = "base",
    emptyText = "-",
}: CurrencyDisplayProps) {
    // Manejar valores nulos o indefinidos
    if (value === null || value === undefined) {
        return (
            <span className={`text-muted-foreground ${className}`}>
                {emptyText}
            </span>
        );
    }

    // Convertir a número si es string
    const numValue = typeof value === "string" ? parseFloat(value) : value;

    // Si no es un número válido, mostrar texto vacío
    if (isNaN(numValue)) {
        return (
            <span className={`text-muted-foreground ${className}`}>
                {emptyText}
            </span>
        );
    }

    // Formatear el valor como moneda
    const formattedValue = formatCurrency(numValue);

    // Construir clases CSS
    const sizeClasses = {
        sm: "text-sm",
        base: "text-base",
        lg: "text-lg",
        xl: "text-xl",
        "2xl": "text-2xl",
    };

    const colorClasses = primary
        ? "text-primary"
        : secondary
        ? "text-secondary"
        : success
        ? "text-green-600 dark:text-green-400"
        : error
        ? "text-destructive"
        : "text-foreground";

    const weightClass = bold ? "font-bold" : "font-normal";

    return (
        <span
            className={`${sizeClasses[size]} ${colorClasses} ${weightClass} ${className}`}
        >
            {formattedValue}
        </span>
    );
}
