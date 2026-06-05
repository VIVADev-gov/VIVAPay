import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function redirectLegacyDashboardPath(pathname: string, request: NextRequest) {
  if (pathname === "/dashboard/contrato") {
    return NextResponse.redirect(
      new URL("/dashboard/contratista/contrato", request.url)
    );
  }

  if (pathname.startsWith("/dashboard/contrato/")) {
    const nextPath = pathname.replace(
      "/dashboard/contrato",
      "/dashboard/contratista/contrato"
    );
    return NextResponse.redirect(new URL(nextPath, request.url));
  }

  if (pathname === "/dashboard/enviar-cuenta-cobro") {
    return NextResponse.redirect(
      new URL("/dashboard/contratista/enviar-cuenta-cobro", request.url)
    );
  }

  return null;
}

export function middleware(request: NextRequest) {
  const legacyRedirect = redirectLegacyDashboardPath(
    request.nextUrl.pathname,
    request
  );
  if (legacyRedirect) return legacyRedirect;
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
