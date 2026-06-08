"use client";

import { useParams } from "next/navigation";
import PaymentAccountReviewWorkspace from "@/components/cuentas-cobro/PaymentAccountReviewWorkspace";
import RoleDashboardLayout from "@/components/layouts/RoleDashboardLayout";
import { USER_ROLES } from "@/constants/userRoles";

export default function SupervisorCuentaCobroReviewPage() {
  const params = useParams<{ contratoId: string; numero: string }>();

  return (
    <RoleDashboardLayout
      allowedRole={USER_ROLES.SUPERVISOR}
      title={`Revisión cuenta ${params.numero}`}
    >
      <PaymentAccountReviewWorkspace
        role={USER_ROLES.SUPERVISOR}
        roleBase="/dashboard/supervisor"
        contractId={params.contratoId}
        numero={Number(params.numero)}
      />
    </RoleDashboardLayout>
  );
}
