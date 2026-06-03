"use client";

import { FileText, Send, UserRound } from "lucide-react";
import {
  DashboardHero,
  DashboardModuleCard,
  DashboardOverviewGrid,
} from "@/components/dashboard";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuthStore } from "@/store/auth/auth.store";

const modules = [
  {
    title: "Información contractual",
    description:
      "Consulta tu contrato vigente, contratos anteriores y el historial de cobros.",
    href: "/dashboard/informacion-contractual",
    icon: FileText,
    accent: "primary" as const,
  },
  {
    title: "Enviar cuenta de cobro",
    description:
      "Revisa la cuenta que sigue, fechas disponibles y prepara el envío.",
    href: "/dashboard/enviar-cuenta-cobro",
    icon: Send,
    accent: "ring" as const,
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

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <DashboardLayout title="Dashboard">
      <section className="grid gap-8">
        <DashboardHero
          eyebrow="Bienvenido a Vivapay"
          title={`Hola, ${user?.name ?? "funcionario"}.`}
          description="Desde aquí podrás enviar tu cuenta de cobro y llevar el registro de tu información contractual."
        />

        <DashboardOverviewGrid />

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
                Entra a cada módulo para gestionar tu información contractual,
                cuentas de cobro y datos de perfil.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary shadow-sm">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Cuenta {user?.status ?? "active"}
            </span>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {modules.map((module) => (
              <DashboardModuleCard key={module.href} {...module} />
            ))}
          </div>
        </section>
      </section>
    </DashboardLayout>
  );
}
