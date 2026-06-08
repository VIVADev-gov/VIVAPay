export function isDevSuperUserLoginUiEnabled() {
  return process.env.NEXT_PUBLIC_DEV_SUPER_USER_ENABLED === "true";
}
