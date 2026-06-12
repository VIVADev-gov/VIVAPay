export function isDevSendCadStateSkipped() {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_DEV_SKIP_SEND_CAD_STATE === "true";
  }

  return process.env.DEV_SKIP_SEND_CAD_STATE === "true";
}
