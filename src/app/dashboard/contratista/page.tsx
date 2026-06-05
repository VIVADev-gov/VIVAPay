"use client";

import { FileText, UserRound } from "lucide-react";
import {
  DashboardHero,
  DashboardModuleCard,
  DashboardOverviewGrid,
} from "@/components/dashboard";
import RoleDashboardLayout from "@/components/layouts/RoleDashboardLayout";
import { USER_ROLES } from "@/constants/userRoles";
import { useAuthStore } from "@/store/auth/auth.store";

const modules = [
  {
    title: "Información contractual",
    description:
      "Consulta tu contrato vigente, contratos anteriores, cuentas de cobro y gestiona el envío desde el detalle.",
    href: "/dashboard/contratista/contrato",
    icon: FileText,
    accent: "primary" as const,
  },
  {
    title: "Perfil",
    description:
      "Actualiza tus datos personales editables sin cambiar correo ni documento.",
    href: "/dashboard/perfil",
    icon: UserRound,
    accent: "secondary" as const,
  },
];

export default function ContratistaDashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <RoleDashboardLayout
      allowedRole={USER_ROLES.CONTRATISTA}
      title="Dashboard contratista"
    >
      <section className="grid gap-8">
        <DashboardHero
          eyebrow="Portal del contratista"
          title={`Hola, ${user?.name ?? "contratista"}.`}
          description="Gestiona tu información contractual y tus cuentas de cobro desde el detalle de tu contrato vigente."
        />

        <DashboardOverviewGrid basePath="/dashboard/contratista" />

        <section className="overflow-hidden rounded-4xl border border-border/80 bg-linear-to-br from-card via-background to-muted/30 p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Accesos rápidos
              </p>
              <h3 className="mt-2 text-2xl font-black text-foreground">
                Módulos disponibles
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Entra a información contractual para ver contratos y cuentas de
                cobro, o actualiza tu perfil.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary shadow-sm">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Cuenta {user?.status ?? "active"}
            </span>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {modules.map((module) => (
              <DashboardModuleCard key={module.href} {...module} />
            ))}
          </div>
        </section>
      </section>
    </RoleDashboardLayout>
  );
}
