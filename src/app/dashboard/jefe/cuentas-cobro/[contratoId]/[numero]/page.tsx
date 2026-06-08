"use client";

import { useParams } from "next/navigation";
import PaymentAccountReviewWorkspace from "@/components/cuentas-cobro/PaymentAccountReviewWorkspace";
import RoleDashboardLayout from "@/components/layouts/RoleDashboardLayout";
import { USER_ROLES } from "@/constants/userRoles";

export default function JefeCuentaCobroReviewPage() {
  const params = useParams<{ contratoId: string; numero: string }>();

  return (
    <RoleDashboardLayout
      allowedRole={USER_ROLES.JEFE}
      title={`Revisión cuenta ${params.numero}`}
    >
      <PaymentAccountReviewWorkspace
        role={USER_ROLES.JEFE}
        roleBase="/dashboard/jefe"
        contractId={params.contratoId}
        numero={Number(params.numero)}
      />
    </RoleDashboardLayout>
  );
}
