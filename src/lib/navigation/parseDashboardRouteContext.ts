export type DashboardRouteKind =
  | "contract-list"
  | "contract-detail"
  | "contractor-account"
  | "review-inbox"
  | "review-account"
  | "other";

export type DashboardRouteContext = {
  contractId: string | null;
  accountNumber: number | null;
  kind: DashboardRouteKind;
};

const REVIEWER_ROLE_SLUGS = ["supervisor", "jefe", "director"] as const;

const DEFAULT_CONTEXT: DashboardRouteContext = {
  contractId: null,
  accountNumber: null,
  kind: "other",
};

export function parseDashboardRouteContext(pathname: string): DashboardRouteContext {
  const contractorAccountMatch = pathname.match(
    /^\/dashboard\/contratista\/contrato\/([^/]+)\/cuentas-cobro\/(\d+)$/
  );
  if (contractorAccountMatch) {
    return {
      contractId: contractorAccountMatch[1],
      accountNumber: Number(contractorAccountMatch[2]),
      kind: "contractor-account",
    };
  }

  const contractorContractMatch = pathname.match(
    /^\/dashboard\/contratista\/contrato\/([^/]+)$/
  );
  if (contractorContractMatch) {
    return {
      contractId: contractorContractMatch[1],
      accountNumber: null,
      kind: "contract-detail",
    };
  }

  if (pathname === "/dashboard/contratista/contrato") {
    return { contractId: null, accountNumber: null, kind: "contract-list" };
  }

  for (const role of REVIEWER_ROLE_SLUGS) {
    const reviewAccountMatch = pathname.match(
      new RegExp(`^/dashboard/${role}/cuentas-cobro/([^/]+)/(\\d+)$`)
    );
    if (reviewAccountMatch) {
      return {
        contractId: reviewAccountMatch[1],
        accountNumber: Number(reviewAccountMatch[2]),
        kind: "review-account",
      };
    }

    if (pathname === `/dashboard/${role}/cuentas-cobro`) {
      return { contractId: null, accountNumber: null, kind: "review-inbox" };
    }
  }

  return DEFAULT_CONTEXT;
}
