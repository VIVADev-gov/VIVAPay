"use client";

import type { ElementType } from "react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export type DashboardModuleCardProps = {
  title: string;
  description: string;
  href: string;
  icon: ElementType<{ className?: string }>;
  accent?: "primary" | "ring" | "secondary";
};

const accentStyles = {
  primary: {
    card: "from-card via-background to-primary/8 hover:border-primary/35 hover:shadow-primary/10",
    icon: "bg-linear-to-br from-primary/20 to-primary/5 text-primary group-hover:from-primary group-hover:to-ring group-hover:text-primary-foreground",
    badge: "bg-primary/10 text-primary",
  },
  ring: {
    card: "from-card via-background to-ring/8 hover:border-ring/35 hover:shadow-ring/10",
    icon: "bg-linear-to-br from-ring/20 to-ring/5 text-ring group-hover:from-ring group-hover:to-primary group-hover:text-primary-foreground",
    badge: "bg-ring/10 text-ring",
  },
  secondary: {
    card: "from-card via-background to-secondary/10 hover:border-secondary/35",
    icon: "bg-linear-to-br from-secondary/25 to-secondary/5 text-secondary group-hover:from-secondary group-hover:to-primary/80 group-hover:text-primary-foreground",
    badge: "bg-secondary/15 text-secondary",
  },
};

export default function DashboardModuleCard({
  title,
  description,
  href,
  icon: Icon,
  accent = "primary",
}: DashboardModuleCardProps) {
  const styles = accentStyles[accent];

  return (
    <Link
      href={href}
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/80 bg-linear-to-br p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${styles.card}`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/5 opacity-0 transition group-hover:opacity-100" />

      <div className="mb-5 flex items-start justify-between gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition duration-300 ${styles.icon}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${styles.badge}`}
        >
          Módulo
          <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>

      <h4 className="text-lg font-black text-foreground">{title}</h4>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
        {description}
      </p>

      <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Acceder
        </span>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition group-hover:scale-105 group-hover:bg-ring">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
