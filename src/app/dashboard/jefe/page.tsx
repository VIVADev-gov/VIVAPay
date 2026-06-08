"use client";

import { BarChart3, UserRound } from "lucide-react";
import { DashboardHero, DashboardModuleCard } from "@/components/dashboard";
import RoleDashboardLayout from "@/components/layouts/RoleDashboardLayout";
import { USER_ROLES } from "@/constants/userRoles";
import { useAuthStore } from "@/store/auth/auth.store";

const modules = [
  {
    title: "Seguimiento de jefatura",
    description:
      "Consulta el estado consolidado de contratos y cuentas de cobro de tu dependencia.",
    href: "/dashboard/jefe/cuentas-cobro",
    icon: BarChart3,
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

export default function JefeDashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <RoleDashboardLayout
      allowedRole={USER_ROLES.JEFE}
      title="Dashboard jefe"
    >
      <section className="grid gap-8">
        <DashboardHero
          eyebrow="Portal del jefe"
          title={`Hola, ${user?.name ?? "jefe"}.`}
          description="Visualiza el avance de tu jefatura y los pendientes de revisión del equipo."
        />

        <div className="grid gap-5 md:grid-cols-2">
          {modules.map((module) => (
            <DashboardModuleCard key={module.href} {...module} />
          ))}
        </div>
      </section>
    </RoleDashboardLayout>
  );
}
