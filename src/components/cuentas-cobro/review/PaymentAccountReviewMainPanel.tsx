"use client";

import { useState, type ReactNode } from "react";
import {
  ReviewDocumentCard,
  ReviewDocumentPlaceholder,
} from "@/components/cuentas-cobro/review/ReviewDocumentCards";
import { formatDeclarationsSummary } from "@/lib/cuentas-cobro/paymentAccountDeclarations";
import { formatGfrFo11Summary } from "@/lib/cuentas-cobro/gfrFo11Responses";
import type { PaymentDocumentRequirement } from "@/lib/cuentas-cobro/paymentAccountRules";
import type {
  PublicCuentaCobro,
  PublicCuentaCobroActividadItem,
  PublicCuentaCobroDocumento,
} from "@/types/contratos";
import { formatDate } from "@/utils/formatters";
import { FileText, ListChecks } from "lucide-react";

type ReviewTab = "revision" | "documentos";

type PaymentAccountReviewMainPanelProps = {
  account: PublicCuentaCobro;
  activities: PublicCuentaCobroActividadItem[];
  phaseLabel: string;
  showGfrFo11: boolean;
  contractRequirements: PaymentDocumentRequirement[];
  accountRequirements: PaymentDocumentRequirement[];
  contractDocuments: PublicCuentaCobroDocumento[];
  accountDocuments: PublicCuentaCobroDocumento[];
};

function SegmentedTabs({
  activeTab,
  onChange,
  documentCount,
  requiredAttached,
  requiredTotal,
}: {
  activeTab: ReviewTab;
  onChange: (tab: ReviewTab) => void;
  documentCount: number;
  requiredAttached: number;
  requiredTotal: number;
}) {
  const tabs: Array<{ id: ReviewTab; label: string; hint?: string }> = [
    { id: "revision", label: "Revisión" },
    {
      id: "documentos",
      label: "Documentos",
      hint:
        requiredTotal > 0
          ? `${requiredAttached}/${requiredTotal}`
          : String(documentCount),
    },
  ];

  return (
    <div className="flex gap-2 rounded-2xl border border-border/60 bg-muted/30 p-1.5">
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.hint ? (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.hint}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function SectionBlock({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: typeof FileText;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-border/50 py-6 last:border-b-0 md:py-8">
      <div className="mb-4 flex items-start gap-3">
        {Icon ? <Icon className="mt-1 h-5 w-5 shrink-0 text-primary" /> : null}
        <div>
          <h3 className="text-lg font-black text-foreground">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function countRequiredDocuments(
  requirements: PaymentDocumentRequirement[],
  documents: PublicCuentaCobroDocumento[]
) {
  const required = requirements.filter((item) => item.required);
  const attached = required.filter((requirement) =>
    documents.some((doc) => doc.tipoDocumento === requirement.tipoDocumento)
  );
  return { attached: attached.length, total: required.length };
}

export default function PaymentAccountReviewMainPanel({
  account,
  activities,
  phaseLabel,
  showGfrFo11,
  contractRequirements,
  accountRequirements,
  contractDocuments,
  accountDocuments,
}: PaymentAccountReviewMainPanelProps) {
  const [activeTab, setActiveTab] = useState<ReviewTab>("revision");

  const contractCounts = countRequiredDocuments(
    contractRequirements,
    contractDocuments
  );
  const accountCounts = countRequiredDocuments(
    accountRequirements,
    accountDocuments
  );
  const requiredAttached = contractCounts.attached + accountCounts.attached;
  const requiredTotal = contractCounts.total + accountCounts.total;
  const documentCount = contractDocuments.length + accountDocuments.length;
  const completionPercent =
    requiredTotal > 0 ? Math.round((requiredAttached / requiredTotal) * 100) : 100;

  return (
    <div className="rounded-4xl border border-border/80 bg-card shadow-sm">
      <div className="border-b border-border/50 p-5 md:p-6">
        <SegmentedTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          documentCount={documentCount}
          requiredAttached={requiredAttached}
          requiredTotal={requiredTotal}
        />
      </div>

      <div className="px-6 pb-8">
        {activeTab === "revision" ? (
          <>
            <SectionBlock title="Actividades" icon={ListChecks}>
              {activities.length === 0 ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  Sin actividades registradas.
                </p>
              ) : (
                <ul className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/60">
                  {activities.map((activity) => (
                    <li key={activity.orden} className="p-4 md:p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {activity.actividad}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {activity.accion}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                          {activity.ejecucion}%
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionBlock>

            <SectionBlock
              title="Declaraciones juradas"
              description="Manifestación bajo gravedad de juramento del contratista."
              icon={FileText}
            >
              {account.declaracionesJuradas ? (
                <p className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm font-semibold leading-6 text-foreground md:p-5">
                  {formatDeclarationsSummary(account.declaracionesJuradas)}
                </p>
              ) : (
                <p className="text-sm text-destructive">
                  Sin declaraciones registradas.
                </p>
              )}
            </SectionBlock>

            {showGfrFo11 ? (
              <SectionBlock
                title="Certificado GFR-FO-11"
                description="Responsable de IVA — primera cuenta de cobro."
                icon={FileText}
              >
                {account.gfrFo11 ? (
                  <p className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm font-semibold leading-6 text-foreground md:p-5">
                    {formatGfrFo11Summary(account.gfrFo11)}
                  </p>
                ) : (
                  <p className="text-sm text-destructive">
                    Sin certificado GFR-FO-11 registrado.
                  </p>
                )}
              </SectionBlock>
            ) : null}

            {(account.devoluciones?.length ?? 0) > 0 ? (
              <SectionBlock title="Historial de devoluciones" icon={FileText}>
                <ul className="space-y-3">
                  {account.devoluciones?.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-2xl border border-border/60 bg-muted/30 p-4 md:p-5"
                    >
                      <p className="text-sm font-semibold leading-6 text-foreground">
                        {item.mensaje}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.deRol} · {formatDate(item.fecha)}
                      </p>
                    </li>
                  ))}
                </ul>
              </SectionBlock>
            ) : null}
          </>
        ) : (
          <div className="py-6 md:py-8">
            {requiredTotal > 0 ? (
              <div className="mb-8 rounded-2xl border border-border/60 bg-muted/30 p-5 md:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-black text-foreground">
                      Completitud de soportes
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {requiredAttached} de {requiredTotal} documentos requeridos
                      adjuntados · {phaseLabel.toLowerCase()}
                    </p>
                  </div>
                  <span className="text-2xl font-black text-primary">
                    {completionPercent}%
                  </span>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
            ) : null}

            {contractRequirements.length > 0 ? (
              <SectionBlock
                title="Del contrato"
                description="Documentos reutilizables del contrato para esta fase."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  {contractRequirements.map((requirement) => {
                    const document = contractDocuments.find(
                      (item) => item.tipoDocumento === requirement.tipoDocumento
                    );

                    return document ? (
                      <ReviewDocumentCard
                        key={requirement.tipoDocumento}
                        document={document}
                        required={requirement.required}
                      />
                    ) : (
                      <ReviewDocumentPlaceholder
                        key={requirement.tipoDocumento}
                        label={requirement.label}
                      />
                    );
                  })}
                </div>
              </SectionBlock>
            ) : null}

            <SectionBlock
              title="De la cuenta"
              description={`Soportes adjuntos a la cuenta No. ${account.numero}.`}
            >
              <div className="grid gap-4 md:grid-cols-2">
                {accountRequirements.length > 0
                  ? accountRequirements.map((requirement) => {
                      const document = accountDocuments.find(
                        (item) => item.tipoDocumento === requirement.tipoDocumento
                      );

                      return document ? (
                        <ReviewDocumentCard
                          key={requirement.tipoDocumento}
                          document={document}
                          required={requirement.required}
                        />
                      ) : (
                        <ReviewDocumentPlaceholder
                          key={requirement.tipoDocumento}
                          label={requirement.label}
                        />
                      );
                    })
                  : null}

                {accountDocuments
                  .filter(
                    (document) =>
                      !accountRequirements.some(
                        (requirement) =>
                          requirement.tipoDocumento === document.tipoDocumento
                      )
                  )
                  .map((document) => (
                    <ReviewDocumentCard key={document.id} document={document} />
                  ))}

                {accountDocuments.length === 0 &&
                accountRequirements.length === 0 ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    Sin documentos de cuenta.
                  </p>
                ) : null}
              </div>
            </SectionBlock>
          </div>
        )}
      </div>
    </div>
  );
}
