"use client";

import { ClipboardCheck, UserRound } from "lucide-react";
import { DashboardHero, DashboardModuleCard } from "@/components/dashboard";
import RoleDashboardLayout from "@/components/layouts/RoleDashboardLayout";
import { USER_ROLES } from "@/constants/userRoles";
import { useAuthStore } from "@/store/auth/auth.store";

const modules = [
  {
    title: "Supervisión de cuentas",
    description:
      "Revisa y da seguimiento a las cuentas de cobro de los contratistas asignados.",
    href: "/dashboard/supervisor",
    icon: ClipboardCheck,
    accent: "primary" as const,
  },
  {
    title: "Perfil",
    description: "Actualiza tus datos de contacto y unidad organizacional.",
    href: "/dashboard/perfil",
    icon: UserRound,
    accent: "secondary" as const,
  },
];

export default function SupervisorDashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <RoleDashboardLayout
      allowedRole={USER_ROLES.SUPERVISOR}
      title="Dashboard supervisor"
    >
      <section className="grid gap-8">
        <DashboardHero
          eyebrow="Portal del supervisor"
          title={`Hola, ${user?.name ?? "supervisor"}.`}
          description="Desde aquí podrás revisar el avance de contratos y cuentas de cobro de tu equipo."
        />

        <section className="rounded-4xl border border-dashed border-primary/25 bg-muted/20 p-6 text-sm leading-6 text-muted-foreground">
          El módulo de supervisión estará disponible en la siguiente iteración.
          Por ahora tienes acceso a tu perfil y a este panel base por rol.
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          {modules.map((module) => (
            <DashboardModuleCard key={module.href} {...module} />
          ))}
        </div>
      </section>
    </RoleDashboardLayout>
  );
}
