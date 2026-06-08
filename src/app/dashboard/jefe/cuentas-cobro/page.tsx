"use client";

import { DashboardHero } from "@/components/dashboard";
import PaymentAccountReviewInbox from "@/components/cuentas-cobro/PaymentAccountReviewInbox";
import RoleDashboardLayout from "@/components/layouts/RoleDashboardLayout";
import { USER_ROLES } from "@/constants/userRoles";

export default function JefeCuentasCobroPage() {
  return (
    <RoleDashboardLayout allowedRole={USER_ROLES.JEFE} title="Cuentas de cobro">
      <section className="grid gap-8">
        <DashboardHero
          eyebrow="Jefatura"
          title="Bandeja de cuentas de cobro"
          description="Revisa, firma y envía al CAD las cuentas de los contratistas de tu jefatura."
        />
        <PaymentAccountReviewInbox roleBase="/dashboard/jefe" />
      </section>
    </RoleDashboardLayout>
  );
}
