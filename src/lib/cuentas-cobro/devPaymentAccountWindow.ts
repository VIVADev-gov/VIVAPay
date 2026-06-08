export function isDevPaymentAccountWindowSkipped() {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_DEV_SKIP_PAYMENT_ACCOUNT_WINDOW === "true";
  }

  return process.env.DEV_SKIP_PAYMENT_ACCOUNT_WINDOW === "true";
}
