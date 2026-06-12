export function getEmailCad(): string {
  return (
    process.env.EMAIL_CAD?.trim() ||
    process.env.PAYMENT_ACCOUNT_FORMS_EMAIL?.trim() ||
    process.env.FACTURACION_CAD_EMAIL?.trim() ||
    ""
  );
}
