"use client";

import { DashboardHero } from "@/components/dashboard";
import PaymentAccountReviewInbox from "@/components/cuentas-cobro/PaymentAccountReviewInbox";
import RoleDashboardLayout from "@/components/layouts/RoleDashboardLayout";
import { USER_ROLES } from "@/constants/userRoles";

export default function DirectorCuentasCobroPage() {
  return (
    <RoleDashboardLayout
      allowedRole={USER_ROLES.DIRECTOR}
      title="Cuentas de cobro"
    >
      <section className="grid gap-8">
        <DashboardHero
          eyebrow="Dirección"
          title="Cuentas pendientes de firma"
          description="Consulta las cuentas enviadas por supervisión y confirma con tu firma institucional."
        />
        <PaymentAccountReviewInbox roleBase="/dashboard/director" />
      </section>
    </RoleDashboardLayout>
  );
}
