import type { ReactNode } from "react";

export type DashboardHeroProps = {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  children?: ReactNode;
  className?: string;
};

export default function DashboardHero({
  eyebrow,
  title,
  description,
  children,
  className = "",
}: DashboardHeroProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-4xl border border-border bg-linear-to-br from-primary to-ring p-8 text-primary-foreground shadow-xl ${className}`.trim()}
    >
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10" />
      <div className="absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-white/10" />

      <div className="relative z-10 max-w-3xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-primary-foreground/75">
          {eyebrow}
        </p>
        <h2 className="text-3xl font-black leading-tight md:text-5xl">{title}</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-primary-foreground/85">
          {description}
        </p>
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}
