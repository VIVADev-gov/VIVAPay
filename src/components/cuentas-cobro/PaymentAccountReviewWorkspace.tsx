"use client";

import { useState } from "react";
import PaymentAccountDevolucionModal from "@/components/cuentas-cobro/PaymentAccountDevolucionModal";
import PaymentAccountReviewContextPanel from "@/components/cuentas-cobro/review/PaymentAccountReviewContextPanel";
import PaymentAccountReviewHeader from "@/components/cuentas-cobro/review/PaymentAccountReviewHeader";
import PaymentAccountReviewMainPanel from "@/components/cuentas-cobro/review/PaymentAccountReviewMainPanel";
import EmptyState from "@/components/ui/EmptyState";
import { CUENTA_COBRO_WORKFLOW_ACTION } from "@/constants/cuentaCobroWorkflow";
import { USER_ROLES, type UserRole } from "@/constants/userRoles";
import {
  usePaymentAccountReviewDetailQuery,
  usePaymentAccountWorkflowMutation,
} from "@/hooks/api/useCuentasCobro";
import { useProfileQuery } from "@/hooks/api/useProfile";
import { isDevSendCadStateSkipped } from "@/lib/cuentas-cobro/devSendCadState";
import { getPaymentPhaseLabel } from "@/lib/cuentas-cobro/paymentAccountReadiness";
import {
  getPaymentDocumentRequirements,
  includesGfrFo11,
  resolvePaymentPhase,
} from "@/lib/cuentas-cobro/paymentAccountRules";
import {
  canDirectorSign,
  canJefeApproveSend,
  canReturnToContractor,
  canSupervisorForwardDirector,
  canSupervisorSendCad,
} from "@/lib/cuentas-cobro/paymentAccountWorkflow";
import { hasUserSignature } from "@/lib/profile/hasUserSignature";
import { useAuthStore } from "@/store/auth/auth.store";
import { useProfileStore } from "@/store/profile/profile.store";
import { useUiStore } from "@/store/ui/ui-store";

type PaymentAccountReviewWorkspaceProps = {
  role: UserRole;
  roleBase: string;
  contractId: string;
  numero: number;
};

export default function PaymentAccountReviewWorkspace({
  role,
  roleBase,
  contractId,
  numero,
}: PaymentAccountReviewWorkspaceProps) {
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  useProfileQuery();
  const showToast = useUiStore((s) => s.showToast);
  const authUser = useAuthStore((s) => s.user);
  const profileUser = useProfileStore((s) => s.user);
  const signatureUser = profileUser ?? authUser;
  const hasSignature = hasUserSignature(signatureUser);

  const detailQuery = usePaymentAccountReviewDetailQuery(contractId, numero);
  const workflowMutation = usePaymentAccountWorkflowMutation(contractId, numero);

  const detail = detailQuery.data;
  const account = detail?.paymentAccount;
  const contract = detail?.contract;
  const contractor = detail?.contractor;

  const runWorkflow = async (
    action: (typeof CUENTA_COBRO_WORKFLOW_ACTION)[keyof typeof CUENTA_COBRO_WORKFLOW_ACTION],
    mensaje?: string
  ) => {
    if (!hasSignature) {
      showToast({
        message: "Debes subir tu firma en Perfil antes de continuar.",
        variant: "error",
      });
      return;
    }

    try {
      await workflowMutation.mutateAsync({ action, mensaje });
      showToast({
        message: "Cuenta actualizada correctamente",
        variant: "success",
      });
      await detailQuery.refetch();
    } catch (error) {
      showToast({
        message:
          error instanceof Error ? error.message : "No se pudo actualizar la cuenta",
        variant: "error",
      });
    }
  };

  if (detailQuery.isLoading) {
    return (
      <EmptyState
        message="Cargando revisión"
        description="Obteniendo la información de la cuenta."
        showRefreshButton={false}
        icon="refresh"
        variant="loading"
      />
    );
  }

  if (!account || !contract || !contractor) {
    return (
      <EmptyState
        message="Cuenta no disponible"
        description="No se encontró la cuenta o no tienes permiso para revisarla."
        variant="error"
        icon="alert"
        onRefresh={() => detailQuery.refetch()}
      />
    );
  }

  const canReturn = canReturnToContractor(account, role);
  const canForwardDirector =
    role === USER_ROLES.SUPERVISOR && canSupervisorForwardDirector(account);
  const canSignDirector =
    role === USER_ROLES.DIRECTOR && canDirectorSign(account);
  const canSendCad =
    role === USER_ROLES.SUPERVISOR && canSupervisorSendCad(account);
  const canJefeSend =
    role === USER_ROLES.JEFE && canJefeApproveSend(account);
  const devSendCadStateSkipped = isDevSendCadStateSkipped();

  const phase = resolvePaymentPhase(account, detail.paymentAccounts);
  const phaseLabel = getPaymentPhaseLabel(account, detail.paymentAccounts);
  const requirements = getPaymentDocumentRequirements(phase);
  const contractRequirements = requirements.filter(
    (requirement) => requirement.scope === "contract"
  );
  const accountRequirements = requirements.filter(
    (requirement) => requirement.scope === "account"
  );

  return (
    <section className="grid gap-8">
      <PaymentAccountReviewHeader
        role={role}
        roleBase={roleBase}
        account={account}
        contract={contract}
        contractor={contractor}
        phaseLabel={phaseLabel}
        hasSignature={hasSignature}
        workflowPending={workflowMutation.isPending}
        devSendCadStateSkipped={devSendCadStateSkipped}
        canReturn={canReturn}
        canForwardDirector={canForwardDirector}
        canSignDirector={canSignDirector}
        canSendCad={canSendCad}
        canJefeSend={canJefeSend}
        onReturnClick={() => setIsReturnModalOpen(true)}
        onWorkflowAction={(action) => void runWorkflow(action)}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(320px,380px)_1fr] lg:items-start">
        <PaymentAccountReviewContextPanel
          contract={contract}
          contractor={contractor}
          collapsible
        />

        <PaymentAccountReviewMainPanel
          account={account}
          activities={detail.activities}
          phaseLabel={phaseLabel}
          showGfrFo11={includesGfrFo11(phase)}
          contractRequirements={contractRequirements}
          accountRequirements={accountRequirements}
          contractDocuments={detail.contractDocuments}
          accountDocuments={detail.accountDocuments}
        />
      </div>

      <PaymentAccountDevolucionModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        loading={workflowMutation.isPending}
        onConfirm={async (mensaje) => {
          await runWorkflow(CUENTA_COBRO_WORKFLOW_ACTION.RETURN, mensaje);
          setIsReturnModalOpen(false);
        }}
      />
    </section>
  );
}
