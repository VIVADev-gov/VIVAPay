"use client";

import { ImageIcon, ImageOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type UrlImagePreviewProps = {
  url: string;
  /** Título sobre el recuadro (p. ej. "Vista previa"). */
  label?: string;
  className?: string;
  /** Clases del contenedor de la imagen (tamaño fijo recomendado). */
  frameClassName?: string;
};

function looksLikeHttpUrl(raw: string): boolean {
  const u = raw.trim();
  if (!u) return false;
  try {
    const parsed = new URL(u);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Muestra una miniatura al pegar una URL de imagen (http/https).
 * Reutilizable en formularios de productos / referencias.
 */
export default function UrlImagePreview({
  url,
  label = "Vista previa",
  className = "",
  frameClassName = "aspect-square w-full max-w-[160px] rounded-xl border border-border bg-muted/30",
}: UrlImagePreviewProps) {
  const trimmed = url.trim();
  const valid = useMemo(() => looksLikeHttpUrl(trimmed), [trimmed]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setLoadError(false);
  }, [trimmed]);

  const showImg = valid && !loadError;

  return (
    <div className={`space-y-2 ${className}`}>
      {label ? (
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      ) : null}
      <div
        className={`flex items-center justify-center overflow-hidden ${frameClassName}`}
      >
        {!trimmed ? (
          <div className="flex flex-col items-center gap-1 p-3 text-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 opacity-50" aria-hidden />
            <span className="text-[11px] leading-tight">Sin URL</span>
          </div>
        ) : !valid ? (
          <div className="flex flex-col items-center gap-1 p-3 text-center text-muted-foreground">
            <ImageOff className="h-7 w-7 opacity-50" aria-hidden />
            <span className="text-[11px] leading-tight">Usa una URL http o https</span>
          </div>
        ) : showImg ? (
          <img
            key={trimmed}
            src={trimmed}
            alt=""
            className="h-full w-full object-contain"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={() => setLoadError(false)}
            onError={() => setLoadError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 p-3 text-center text-destructive/80">
            <ImageOff className="h-7 w-7" aria-hidden />
            <span className="text-[11px] leading-tight">No se pudo cargar la imagen</span>
          </div>
        )}
      </div>
    </div>
  );
}
