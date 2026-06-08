"use client";

import { DashboardHero } from "@/components/dashboard";
import PaymentAccountReviewInbox from "@/components/cuentas-cobro/PaymentAccountReviewInbox";
import RoleDashboardLayout from "@/components/layouts/RoleDashboardLayout";
import { USER_ROLES } from "@/constants/userRoles";

export default function SupervisorCuentasCobroPage() {
  return (
    <RoleDashboardLayout
      allowedRole={USER_ROLES.SUPERVISOR}
      title="Cuentas de cobro"
    >
      <section className="grid gap-8">
        <DashboardHero
          eyebrow="Supervisión"
          title="Bandeja de cuentas de cobro"
          description="Revisa las cuentas enviadas por los contratistas de tu dirección y procésalas con el director."
        />
        <PaymentAccountReviewInbox roleBase="/dashboard/supervisor" />
      </section>
    </RoleDashboardLayout>
  );
}
