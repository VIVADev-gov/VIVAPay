"use client";

import React from "react";
import ActionButton from "@/components/buttons/ActionButton";
import { LucideIcon } from "lucide-react";

export interface SelectableItem {
    id: number | string;
    [key: string]: unknown;
}

// Type helper para hacer que cualquier objeto con id sea SelectableItem
type WithId<T> = T & { id: number | string };

interface MultiSelectCheckboxProps<T extends { id: number | string }> {
    /**
     * Etiqueta del campo
     */
    label: string;

    /**
     * ID del campo (para accesibilidad)
     */
    id?: string;

    /**
     * Lista de opciones disponibles
     */
    options: T[];

    /**
     * IDs de las opciones seleccionadas
     */
    selectedIds: (number | string)[];

    /**
     * Función que se ejecuta cuando cambia la selección
     */
    onChange: (id: number | string) => void;

    /**
     * Estado de carga
     */
    loading?: boolean;

    /**
     * Estado deshabilitado
     */
    disabled?: boolean;

    /**
     * Mensaje de carga personalizado
     */
    loadingMessage?: string;

    /**
     * Mensaje cuando no hay opciones disponibles
     */
    emptyMessage?: string;

    /**
     * Función para renderizar el label de cada opción
     */
    renderLabel: (item: T) => React.ReactNode;

    /**
     * Texto de ayuda
     */
    helperText?: string;

    /**
     * Nombre singular del item (para el contador, ej: "municipio")
     */
    itemName?: string;

    /**
     * Nombre plural del item (para el contador, ej: "municipios")
     */
    itemNamePlural?: string;

    /**
     * Altura máxima del contenedor con scroll
     */
    maxHeight?: string;

    /**
     * Botón de acción en el header (opcional)
     */
    headerAction?: {
        icon: LucideIcon;
        label: string;
        onClick: () => void;
        variant?: "primary" | "secondary" | "outline" | "danger";
    };

    /**
     * Botón de acción cuando la lista está vacía (opcional)
     */
    emptyAction?: {
        icon: LucideIcon;
        label: string;
        onClick: () => void;
        variant?: "primary" | "secondary" | "outline" | "danger";
    };

    /**
     * Clase CSS adicional
     */
    className?: string;
}

/**
 * Componente reutilizable para selección múltiple con checkboxes
 * 
 * @example
 * <MultiSelectCheckbox
 *     label="Municipios"
 *     options={municipios}
 *     selectedIds={formData.municipios}
 *     onChange={handleMunicipioChange}
 *     loading={loadingMunicipios}
 *     renderLabel={(m) => `${m.nombre} (${m.departamento})`}
 *     itemName="municipio"
 *     itemNamePlural="municipios"
 * />
 */
export default function MultiSelectCheckbox<T extends { id: number | string }>({
    label,
    id,
    options,
    selectedIds,
    onChange,
    loading = false,
    disabled = false,
    loadingMessage = "Cargando...",
    emptyMessage,
    renderLabel,
    helperText,
    itemName = "item",
    itemNamePlural,
    maxHeight = "max-h-60",
    headerAction,
    emptyAction,
    className = "",
}: MultiSelectCheckboxProps<T>) {
    const pluralName = itemNamePlural || `${itemName}s`;
    const selectedCount = selectedIds.length;
    const hasSelection = selectedCount > 0;

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Header con label y botón opcional */}
            <div className={headerAction ? "flex items-center justify-between" : ""}>
                <label htmlFor={id} className="block text-sm font-medium text-foreground">
                    {label}
                </label>
                {headerAction && (
                    <ActionButton
                        type="button"
                        variant={headerAction.variant || "outline"}
                        icon={headerAction.icon}
                        label={headerAction.label}
                        onClick={headerAction.onClick}
                        disabled={disabled}
                        className="text-xs"
                    />
                )}
            </div>

            {/* Contenedor con scroll */}
            <div className={`${maxHeight} overflow-y-auto border border-border rounded-lg p-3 bg-background`}>
                {loading ? (
                    <div className="text-center py-4 text-muted-foreground">
                        {loadingMessage}
                    </div>
                ) : options.length === 0 ? (
                    <div className="text-center py-4 space-y-3">
                        {emptyMessage && (
                            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                        )}
                        {emptyAction && (
                            <ActionButton
                                type="button"
                                variant={emptyAction.variant || "primary"}
                                icon={emptyAction.icon}
                                label={emptyAction.label}
                                onClick={emptyAction.onClick}
                                disabled={disabled}
                            />
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {options.map((item) => {
                            const isSelected = selectedIds.includes(item.id);
                            return (
                                <label
                                    key={item.id}
                                    className="flex items-center space-x-2 p-2 rounded hover:bg-card/50 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => onChange(item.id)}
                                        disabled={disabled}
                                        className="w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-2"
                                    />
                                    <span className="text-sm text-foreground">
                                        {renderLabel(item)}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Helper text */}
            {helperText && (
                <p className="text-xs text-muted-foreground">{helperText}</p>
            )}

            {/* Contador de seleccionados */}
            {hasSelection && (
                <p className="text-xs text-primary">
                    {selectedCount} {selectedCount === 1 ? itemName : pluralName} seleccionado{selectedCount !== 1 ? "s" : ""}
                </p>
            )}
        </div>
    );
}
