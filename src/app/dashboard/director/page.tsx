"use client";

import { ClipboardCheck, UserRound } from "lucide-react";
import { DashboardHero, DashboardModuleCard } from "@/components/dashboard";
import RoleDashboardLayout from "@/components/layouts/RoleDashboardLayout";
import { USER_ROLES } from "@/constants/userRoles";
import { useAuthStore } from "@/store/auth/auth.store";

const modules = [
  {
    title: "Firmas de cuentas de cobro",
    description:
      "Revisa y firma las cuentas enviadas por supervisión antes del envío al CAD.",
    href: "/dashboard/director/cuentas-cobro",
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

        <div className="grid gap-5 md:grid-cols-2">
          {modules.map((module) => (
            <DashboardModuleCard key={module.href} {...module} />
          ))}
        </div>
      </section>
    </RoleDashboardLayout>
  );
}
