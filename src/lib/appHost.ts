const DEFAULT_APP_HOST = "http://localhost:3000";

/**
 * URL base pública de la aplicación (sin barra final).
 * Fuente única: NEXT_PUBLIC_HOST (enlaces en correos, verificación de registro, etc.).
 */
export function getAppHost(): string {
  const host = process.env.NEXT_PUBLIC_HOST?.trim();
  return host || DEFAULT_APP_HOST;
}

/** Construye una URL absoluta a partir de un path relativo (ej. `/auth/login`). */
export function buildAppUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getAppHost().replace(/\/$/, "")}${normalizedPath}`;
}
