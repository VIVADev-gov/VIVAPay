"use client";

import { useParams } from "next/navigation";
import PaymentAccountReviewWorkspace from "@/components/cuentas-cobro/PaymentAccountReviewWorkspace";
import RoleDashboardLayout from "@/components/layouts/RoleDashboardLayout";
import { USER_ROLES } from "@/constants/userRoles";

export default function DirectorCuentaCobroReviewPage() {
  const params = useParams<{ contratoId: string; numero: string }>();

  return (
    <RoleDashboardLayout
      allowedRole={USER_ROLES.DIRECTOR}
      title={`Firma cuenta ${params.numero}`}
    >
      <PaymentAccountReviewWorkspace
        role={USER_ROLES.DIRECTOR}
        roleBase="/dashboard/director"
        contractId={params.contratoId}
        numero={Number(params.numero)}
      />
    </RoleDashboardLayout>
  );
}
