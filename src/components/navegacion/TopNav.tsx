// TopNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ChevronRight } from "lucide-react";

type TopNavProps = {
  baseLabel?: string;
  homeHref?: string;
};

const HIDDEN_SEGMENTS = new Set([
  "dashboard",
  "admin",
  "shop-admin",
  "automerco-admin",
  "automerco-admin-shop",
  "shop-profile",
]);

function formatSegment(segment: string): string {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildHref(segments: string[], upTo: number): string {
  return "/" + segments.slice(0, upTo + 1).join("/");
}

export default function TopNav({
  baseLabel = "Inicio",
  homeHref = "/dashboard",
}: TopNavProps) {
  const pathname = usePathname();
  const rawSegments = pathname.split("/").filter(Boolean);
  const segments = rawSegments.filter((segment) => !HIDDEN_SEGMENTS.has(segment));

  return (
    <nav
      aria-label="Ruta actual"
      className="flex min-h-9 w-full items-center overflow-x-auto pb-3 scrollbar-none"
    >
      <ol className="flex min-w-max items-center gap-1 text-xs text-muted-foreground">
        {/* Home */}
        <li>
          <Link
            href={homeHref}
            className="
              flex items-center gap-1.5 rounded-md px-2 py-1
              font-medium text-muted-foreground
              transition-colors duration-150
              hover:bg-muted hover:text-foreground
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
            "
          >
            <Home size={13} className="shrink-0" />
            <span>{baseLabel}</span>
          </Link>
        </li>

        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const sourceIndex = rawSegments.findIndex((value) => value === segment);
          const href = sourceIndex >= 0 ? buildHref(rawSegments, sourceIndex) : buildHref(segments, index);

          return (
            <li key={`${segment}-${index}`} className="flex items-center gap-1">
              {/* Separador */}
              <ChevronRight
                size={13}
                className="shrink-0 text-border"
                aria-hidden
              />

              {isLast ? (
                /* Segmento activo — no es link */
                <span
                  aria-current="page"
                  className="
                    rounded-md px-2 py-1
                    font-medium text-foreground
                    bg-muted/60
                  "
                >
                  {formatSegment(segment)}
                </span>
              ) : (
                /* Segmento intermedio — link */
                <Link
                  href={href}
                  className="
                    rounded-md px-2 py-1
                    text-muted-foreground
                    transition-colors duration-150
                    hover:bg-muted hover:text-foreground
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
                  "
                >
                  {formatSegment(segment)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}