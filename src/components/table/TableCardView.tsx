"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Grid3X3, List, Search } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { useUiStore } from "@/store/ui/ui-store";
import DataTable, { type DataTableColumnConfig } from "./DataTable";

type ViewMode = "table" | "card";

export type TableCardViewProps<T extends object> = {
  data: T[];
  columns: DataTableColumnConfig<T>[];
  dataKey?: keyof T | string;
  renderCard: (item: T, index: number) => React.ReactNode;
  searchFields?: Array<keyof T | string>;
  searchPlaceholder?: string;
  showSearch?: boolean;
  title?: string;
  initialView?: ViewMode;
  viewModeKey?: string;
  rowsPerPageOptions?: number[];
  initialRows?: number;
  emptyMessage?: string;
  className?: string;
  loading?: boolean;
  paginationMode?: "client" | "server";
  serverPage?: number;
  serverPageSize?: number;
  serverHasNextPage?: boolean;
  onServerPageChange?: (page: number) => void;
  onServerPageSizeChange?: (pageSize: number) => void;
  onServerSearchTextChange?: (searchText: string) => void;
  resultCountLabel?: string;
  controlledSearchText?: string;
  onControlledSearchChange?: (value: string) => void;
  suppressLocalSearchFilter?: boolean;
  searchHint?: string;
  onRefresh?: () => void;
};

const DEFAULT_ROWS_OPTIONS = [7, 12, 24];

function getValueByPath(item: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (
      acc &&
      typeof acc === "object" &&
      key in (acc as Record<string, unknown>)
    ) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, item);
}

function normalizeText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.toLowerCase();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).toLowerCase();
  }
  return "";
}

function getItemKey<T extends object>(
  item: T,
  dataKey: keyof T | string | undefined,
  index: number
) {
  if (!dataKey) return String(index);
  const value = getValueByPath(item, String(dataKey));
  return value == null ? String(index) : String(value);
}

export default function TableCardView<T extends object>({
  data,
  columns,
  dataKey,
  renderCard,
  searchFields = [],
  searchPlaceholder = "Buscar...",
  showSearch = true,
  title,
  initialView = "table",
  viewModeKey,
  rowsPerPageOptions = DEFAULT_ROWS_OPTIONS,
  initialRows = rowsPerPageOptions[0] ?? 12,
  emptyMessage = "No hay registros para mostrar.",
  className = "",
  loading = false,
  paginationMode = "client",
  serverPage = 0,
  serverPageSize = initialRows,
  serverHasNextPage = false,
  onServerPageChange,
  onServerPageSizeChange,
  onServerSearchTextChange,
  resultCountLabel,
  controlledSearchText,
  onControlledSearchChange,
  suppressLocalSearchFilter = false,
  searchHint,
  onRefresh,
}: TableCardViewProps<T>) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [internalSearchText, setInternalSearchText] = useState("");
  const [rows, setRows] = useState(initialRows);
  const [cardPage, setCardPage] = useState(0);
  const hydrateTableViewModes = useUiStore((s) => s.hydrateTableViewModes);
  const setStoredTableViewMode = useUiStore((s) => s.setTableViewMode);
  const storedViewMode = useUiStore((s) =>
    viewModeKey ? s.tableViewModes[viewModeKey] : undefined
  );
  const effectiveViewMode = viewModeKey
    ? (storedViewMode ?? initialView)
    : viewMode;

  useEffect(() => {
    if (viewModeKey) hydrateTableViewModes();
  }, [hydrateTableViewModes, viewModeKey]);

  const handleViewModeChange = (next: ViewMode) => {
    if (viewModeKey) {
      setStoredTableViewMode(viewModeKey, next);
    } else {
      setViewMode(next);
    }
  };

  const isSearchControlled =
    typeof controlledSearchText === "string" &&
    typeof onControlledSearchChange === "function";
  const searchText = isSearchControlled
    ? controlledSearchText
    : internalSearchText;

  const isServer = paginationMode === "server";
  const effectiveRows = isServer ? serverPageSize : rows;

  const filteredData = useMemo(() => {
    if (suppressLocalSearchFilter) return data;
    const query = searchText.trim().toLowerCase();
    if (!query || searchFields.length === 0) return data;

    return data.filter((item) =>
      searchFields.some((field) =>
        normalizeText(getValueByPath(item, String(field))).includes(query)
      )
    );
  }, [data, searchFields, searchText, suppressLocalSearchFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / effectiveRows));
  const safeClientPage = Math.min(cardPage, totalPages - 1);
  const start = isServer ? 0 : safeClientPage * effectiveRows;
  const end = isServer ? filteredData.length : start + effectiveRows;
  const pagedCards = isServer ? filteredData : filteredData.slice(start, end);

  const goPrev = () => {
    if (isServer) {
      onServerPageChange?.(Math.max(0, serverPage - 1));
      return;
    }
    setCardPage((prev) => Math.max(0, prev - 1));
  };

  const goNext = () => {
    if (isServer) {
      onServerPageChange?.(serverPage + 1);
      return;
    }
    setCardPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  const handleSearchChange = (value: string) => {
    if (isSearchControlled) {
      onControlledSearchChange(value);
    } else {
      setInternalSearchText(value);
    }

    if (isServer) {
      onServerSearchTextChange?.(value);
    } else {
      setCardPage(0);
    }
  };

  const footerPageLabel = isServer ? serverPage + 1 : safeClientPage + 1;
  const footerTotalPages = isServer ? null : totalPages;
  const canGoPrev = isServer ? serverPage > 0 : safeClientPage > 0;
  const canGoNext = isServer
    ? Boolean(serverHasNextPage)
    : safeClientPage < totalPages - 1;
  const countSubtitle =
    resultCountLabel ??
    `${filteredData.length} ${
      filteredData.length === 1 ? "registro" : "registros"
    }`;

  return (
    <section className={`space-y-4 ${className}`.trim()}>
      <header className="rounded-2xl border border-primary/15 bg-linear-to-br from-primary/10 via-card to-ring/10 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            {title ? (
              <h2 className="truncate text-lg font-semibold text-foreground">
                {title}
              </h2>
            ) : null}
            <p className="text-xs text-muted-foreground">{countSubtitle}</p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-background/90 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => handleViewModeChange("table")}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                effectiveViewMode === "table"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <List className="h-4 w-4" />
              Tabla
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange("card")}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                effectiveViewMode === "card"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
              Cartas
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {showSearch ? (
            <div className="min-w-[220px] flex-1 space-y-1">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-xl border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none ring-0 transition focus:border-ring focus:ring-2 focus:ring-ring/25"
                />
              </label>
              {searchHint ? (
                <p className="pl-1 text-[11px] text-muted-foreground">
                  {searchHint}
                </p>
              ) : null}
            </div>
          ) : null}

          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            Filas:
            <select
              value={effectiveRows}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (isServer) {
                  onServerPageSizeChange?.(value);
                } else {
                  setRows(value);
                  setCardPage(0);
                }
              }}
              className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
            >
              {rowsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {effectiveViewMode === "table" ? (
        <>
          <DataTable<T>
            value={filteredData}
            columns={columns}
            dataKey={dataKey}
            emptyMessage={emptyMessage}
            loading={loading}
            paginator={!isServer}
            rows={effectiveRows}
            rowsPerPageOptions={rowsPerPageOptions}
            stripedRows
          />
          {isServer ? (
            <PaginationFooter
              pageLabel={footerPageLabel}
              totalPages={footerTotalPages}
              canGoPrev={canGoPrev}
              canGoNext={canGoNext}
              onPrev={goPrev}
              onNext={goNext}
            />
          ) : null}
        </>
      ) : (
        <div
          className={`space-y-4 ${
            loading && isServer
              ? "pointer-events-none opacity-55 transition-opacity"
              : ""
          }`}
        >
          {pagedCards.length === 0 ? (
            <EmptyState
              message={emptyMessage}
              description="Puedes crear un nuevo registro o recargar la lista."
              variant="empty"
              icon="inbox"
              onRefresh={onRefresh}
              showRefreshButton={Boolean(onRefresh)}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pagedCards.map((item, index) => (
                <div key={getItemKey(item, dataKey, start + index)}>
                  {renderCard(item, start + index)}
                </div>
              ))}
            </div>
          )}

          <PaginationFooter
            pageLabel={footerPageLabel}
            totalPages={footerTotalPages}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            onPrev={goPrev}
            onNext={goNext}
          />
        </div>
      )}
    </section>
  );
}

function PaginationFooter({
  pageLabel,
  totalPages,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
}: {
  pageLabel: number;
  totalPages: number | null;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <footer className="flex items-center justify-between rounded-xl border border-primary/15 bg-linear-to-r from-card to-primary/5 p-3">
      <p className="text-xs text-muted-foreground">
        Página {pageLabel}
        {totalPages != null ? ` de ${totalPages}` : null}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canGoPrev}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </footer>
  );
}
