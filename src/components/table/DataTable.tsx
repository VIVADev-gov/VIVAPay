"use client";

import React from "react";
import { DataTable as PrimeDataTable } from "primereact/datatable";
import { Column } from "primereact/column";

export interface DataTableColumnConfig<T = object> {
    /** Campo del objeto de datos (path o key) */
    field: keyof T | string;
    /** Título de la columna */
    header: string;
    /** Si la columna es ordenable */
    sortable?: boolean;
    /** Render personalizado de la celda. Si no se define, se usa el valor de `field`. */
    body?: (row: T) => React.ReactNode;
    /** Alineación del contenido: left, right, center */
    align?: "left" | "right" | "center";
    /** Alineación del encabezado */
    alignHeader?: "left" | "right" | "center";
    /** Ancho mínimo o estilo de la columna */
    style?: React.CSSProperties;
    /** Clase CSS de la celda */
    bodyClassName?: string;
    /** Si la columna está oculta */
    hidden?: boolean;
}

export interface DataTableProps<T = object> {
    /** Datos a mostrar */
    value: T[];
    /** Configuración de columnas */
    columns: DataTableColumnConfig<T>[];
    /** Clave única por fila (ej: "id"). Obligatorio si los datos pueden cambiar. */
    dataKey?: keyof T | string;
    /** Mensaje cuando no hay datos */
    emptyMessage?: string;
    /** Estado de carga (muestra skeleton) */
    loading?: boolean;
    /** Habilitar paginación */
    paginator?: boolean;
    /** Filas por página cuando paginator está activo */
    rows?: number;
    /** Opciones de filas por página (ej: [10, 25, 50]) */
    rowsPerPageOptions?: number[];
    /** Tamaño de la tabla: small, normal, large */
    size?: "small" | "normal" | "large";
    /** Filas con estilo alternado (striped) */
    stripedRows?: boolean;
    /** Mostrar rejilla entre celdas */
    showGridlines?: boolean;
    /** Clase CSS del contenedor */
    className?: string;
    /** Estilo del contenedor */
    style?: React.CSSProperties;
    /** Clase por fila (p. ej. resaltar acciones pendientes). */
    rowClassName?: (row: T) => string | undefined;
}

const DEFAULT_EMPTY_MESSAGE = "No hay registros para mostrar.";
const DEFAULT_ROWS_PER_PAGE = 10;
const DEFAULT_ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

function DataTableInner<T extends object>({
    value,
    columns,
    dataKey,
    emptyMessage = DEFAULT_EMPTY_MESSAGE,
    loading = false,
    paginator = false,
    rows = DEFAULT_ROWS_PER_PAGE,
    rowsPerPageOptions = DEFAULT_ROWS_PER_PAGE_OPTIONS,
    size = "normal",
    stripedRows = false,
    showGridlines = false,
    className,
    style,
    rowClassName,
}: DataTableProps<T>) {
    const visibleColumns = columns.filter((col) => !col.hidden);

    return (
        <div className={`data-table-viva overflow-hidden rounded-lg border border-border bg-card ${className ?? ""}`.trim()} style={style}>
            <PrimeDataTable
                value={value}
                dataKey={dataKey as string}
                loading={loading}
                emptyMessage={emptyMessage}
                paginator={paginator}
                rows={rows}
                rowsPerPageOptions={rowsPerPageOptions}
                size={size}
                stripedRows={stripedRows}
                showGridlines={showGridlines}
                rowClassName={rowClassName ? (row: T) => rowClassName(row) ?? "" : undefined}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
            >
                {visibleColumns.map((col, index) => (
                    <Column
                        key={`${String(col.field)}-${index}`}
                        field={col.field as string}
                        header={col.header}
                        sortable={col.sortable ?? false}
                        align={col.align}
                        alignHeader={col.alignHeader}
                        style={col.style}
                        bodyClassName={col.bodyClassName}
                        body={col.body ? (row: T) => col.body!(row) : undefined}
                    />
                ))}
            </PrimeDataTable>
        </div>
    );
}

/** Tabla de datos reutilizable basada en PrimeReact DataTable. */
export function DataTable<T extends object>(props: DataTableProps<T>) {
    return <DataTableInner<T> {...props} />;
}

export default DataTable;
