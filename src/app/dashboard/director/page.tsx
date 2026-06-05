"use client";

import { Building2, UserRound } from "lucide-react";
import { DashboardHero, DashboardModuleCard } from "@/components/dashboard";
import RoleDashboardLayout from "@/components/layouts/RoleDashboardLayout";
import { USER_ROLES } from "@/constants/userRoles";
import { useAuthStore } from "@/store/auth/auth.store";

const modules = [
  {
    title: "Vista directiva",
    description:
      "Consulta indicadores y seguimiento consolidado por dirección o proceso.",
    href: "/dashboard/director",
    icon: Building2,
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

export default function DirectorDashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <RoleDashboardLayout
      allowedRole={USER_ROLES.DIRECTOR}
      title="Dashboard director"
    >
      <section className="grid gap-8">
        <DashboardHero
          eyebrow="Portal del director"
          title={`Hola, ${user?.name ?? "director"}.`}
          description="Accede a la vista consolidada de contratos, cuentas de cobro y pendientes por dirección."
        />

        <section className="rounded-4xl border border-dashed border-primary/25 bg-muted/20 p-6 text-sm leading-6 text-muted-foreground">
          El tablero directivo se habilitará en la siguiente iteración. La ruta
          y el rol ya quedaron separados del portal del contratista.
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
