import {
  getDeclarationAnswerLabel,
  PAYMENT_ACCOUNT_DECLARATION_ITEMS,
  type PaymentAccountDeclarations,
} from "@/lib/cuentas-cobro/paymentAccountDeclarations";

type PaymentAccountDeclarationsDisplayProps = {
  declarations: PaymentAccountDeclarations;
};

export default function PaymentAccountDeclarationsDisplay({
  declarations,
}: PaymentAccountDeclarationsDisplayProps) {
  return (
    <div className="grid gap-4">
      {PAYMENT_ACCOUNT_DECLARATION_ITEMS.map((item) => {
        const value = declarations[item.key];

        return (
          <article
            key={item.key}
            className="rounded-2xl border border-border/60 bg-muted/30 p-4 md:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h4 className="text-sm font-bold text-foreground">
                {item.number}. {item.title}
              </h4>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                  value
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {getDeclarationAnswerLabel(value)}
              </span>
            </div>

            {item.intro ? (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {item.intro}
              </p>
            ) : null}

            <p className="mt-3 text-sm font-semibold leading-6 text-foreground">
              {item.statement}
            </p>

            {item.commitment ? (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.commitment}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
