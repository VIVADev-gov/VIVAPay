let unauthorizedHandler: (() => void) | null = null;
let handlingUnauthorized = false;

export function registerUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

export function notifyUnauthorized() {
  if (handlingUnauthorized) return;
  handlingUnauthorized = true;
  unauthorizedHandler?.();
  window.setTimeout(() => {
    handlingUnauthorized = false;
  }, 3000);
}

export function shouldTriggerSessionLogout(
  status: number | undefined,
  requestUrl: string | undefined
) {
  if (status !== 401 || typeof window === "undefined") return false;
  if (!localStorage.getItem("token")) return false;

  const url = requestUrl ?? "";
  if (url.includes("/api/auth/login")) return false;
  if (url.includes("/api/auth/register")) return false;
  if (url.includes("/api/auth/forgot-password")) return false;
  if (url.includes("/api/auth/reset-password")) return false;

  return true;
}
