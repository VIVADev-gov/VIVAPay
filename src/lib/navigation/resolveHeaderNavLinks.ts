import { USER_ROLES, type UserRole } from "@/constants/userRoles";
import {
  getContractDetailHref,
  getPaymentAccountHref,
  getPaymentAccountReviewHref,
} from "@/lib/cuentas-cobro/paymentAccountAccess";
import { isNavItemActive } from "@/lib/navigation/matchNavPath";
import { parseDashboardRouteContext } from "@/lib/navigation/parseDashboardRouteContext";
import type { PublicContrato, PublicCuentaCobro } from "@/types/contratos";

const CONTRATISTA_CONTRACT_LIST = "/dashboard/contratista/contrato";

export type HeaderNavItem = {
  id: string;
  label: string;
  href: string;
  isActive: boolean;
};

export type ResolveHeaderNavLinksInput = {
  role: UserRole;
  pathname: string;
  roleBase: string;
  currentContract: PublicContrato | null;
  lastContract: PublicContrato | null;
  detailContract: PublicContrato | null;
  nextPaymentAccount: PublicCuentaCobro | null;
  lastPaymentAccount: PublicCuentaCobro | null;
};

function getContractNumber(contract: PublicContrato): string {
  return contract.actual.numeroContrato ?? contract.numeroContrato;
}

function resolveContract(
  contractId: string | null,
  currentContract: PublicContrato | null,
  lastContract: PublicContrato | null,
  detailContract: PublicContrato | null
): PublicContrato | null {
  if (contractId) {
    if (detailContract?.id === contractId) return detailContract;
    if (currentContract?.id === contractId) return currentContract;
    if (lastContract?.id === contractId) return lastContract;
  }

  return currentContract ?? lastContract;
}

function getContractLabel(contract: PublicContrato | null, contractId: string | null): string {
  if (contract) {
    return `Contrato No. ${getContractNumber(contract)}`;
  }
  if (contractId) {
    return "Contrato actual";
  }
  return "Contratos";
}

function resolveContratistaAccount(
  routeContext: ReturnType<typeof parseDashboardRouteContext>,
  nextPaymentAccount: PublicCuentaCobro | null,
  lastPaymentAccount: PublicCuentaCobro | null
): { contratoId: string; numero: number } | null {
  if (
    routeContext.kind === "contractor-account" &&
    routeContext.contractId &&
    routeContext.accountNumber != null
  ) {
    return {
      contratoId: routeContext.contractId,
      numero: routeContext.accountNumber,
    };
  }

  if (nextPaymentAccount) {
    return {
      contratoId: nextPaymentAccount.contratoId,
      numero: nextPaymentAccount.numero,
    };
  }

  if (lastPaymentAccount) {
    return {
      contratoId: lastPaymentAccount.contratoId,
      numero: lastPaymentAccount.numero,
    };
  }

  return null;
}

function hasGeneratedPaymentAccounts(
  contract: PublicContrato | null,
  routeContext: ReturnType<typeof parseDashboardRouteContext>,
  nextPaymentAccount: PublicCuentaCobro | null,
  lastPaymentAccount: PublicCuentaCobro | null
): boolean {
  if (routeContext.kind === "contractor-account") return true;
  if ((contract?.paymentAccountCount ?? 0) > 0) return true;
  if (nextPaymentAccount || lastPaymentAccount) return true;
  return false;
}

function resolveContratistaNav(
  input: ResolveHeaderNavLinksInput
): HeaderNavItem[] {
  const routeContext = parseDashboardRouteContext(input.pathname);
  const contract = resolveContract(
    routeContext.contractId,
    input.currentContract,
    input.lastContract,
    input.detailContract
  );
  const contractId = contract?.id ?? routeContext.contractId;

  const contractHref = contractId
    ? getContractDetailHref(contractId)
    : CONTRATISTA_CONTRACT_LIST;
  const contractLabel = getContractLabel(contract, routeContext.contractId);

  const items: HeaderNavItem[] = [
    {
      id: "contract",
      label: contractLabel,
      href: contractHref,
      isActive: isNavItemActive(input.pathname, contractHref, {
        exact: !contractId,
      }),
    },
  ];

  if (
    hasGeneratedPaymentAccounts(
      contract,
      routeContext,
      input.nextPaymentAccount,
      input.lastPaymentAccount
    )
  ) {
    const account = resolveContratistaAccount(
      routeContext,
      input.nextPaymentAccount,
      input.lastPaymentAccount
    );

    if (account) {
      const accountHref = getPaymentAccountHref(account.contratoId, account.numero);
      items.push({
        id: "payment-account",
        label: `Cuenta No. ${account.numero}`,
        href: accountHref,
        isActive: isNavItemActive(input.pathname, accountHref),
      });
    }
  }

  return items;
}

function resolveReviewerNav(input: ResolveHeaderNavLinksInput): HeaderNavItem[] {
  const routeContext = parseDashboardRouteContext(input.pathname);
  const inboxHref = `${input.roleBase}/cuentas-cobro`;

  const items: HeaderNavItem[] = [
    {
      id: "payment-accounts-inbox",
      label: "Cuentas de cobro",
      href: inboxHref,
      isActive: input.pathname === inboxHref,
    },
  ];

  if (
    routeContext.kind === "review-account" &&
    routeContext.contractId &&
    routeContext.accountNumber != null
  ) {
    const accountHref = getPaymentAccountReviewHref(
      input.roleBase,
      routeContext.contractId,
      routeContext.accountNumber
    );
    items.push({
      id: "payment-account",
      label: `Cuenta No. ${routeContext.accountNumber}`,
      href: accountHref,
      isActive: isNavItemActive(input.pathname, accountHref),
    });
  }

  return items;
}

export function resolveHeaderNavLinks(
  input: ResolveHeaderNavLinksInput
): HeaderNavItem[] {
  switch (input.role) {
    case USER_ROLES.CONTRATISTA:
      return resolveContratistaNav(input);
    case USER_ROLES.SUPERVISOR:
    case USER_ROLES.JEFE:
    case USER_ROLES.DIRECTOR:
      return resolveReviewerNav(input);
    default:
      return [];
  }
}
