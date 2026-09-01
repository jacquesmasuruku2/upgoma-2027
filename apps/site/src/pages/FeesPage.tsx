import Layout from "@/components/Layout";
import { useLanguage } from "@/i18n/LanguageContext";
import { useFees } from "@/hooks/useSupabaseData";
import AnimatedSection from "@/components/AnimatedSection";
import { GraduationCap, ChevronRight, Banknote, CreditCard, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";
import heroCampusBg from "@/assets/hero-bg.jpg";
import { PdfDownloadCard } from "@/components/fees/PdfDownloadCard";

type FeeRow = Database["public"]["Tables"]["fees"]["Row"];

function groupFeesByFaculty(rows: FeeRow[]) {
  const order = new Map<string, number>();
  rows.forEach((r, i) => {
    if (!order.has(r.faculty)) order.set(r.faculty, i);
  });
  const map = new Map<string, FeeRow[]>();
  for (const r of rows) {
    const list = map.get(r.faculty) ?? [];
    list.push(r);
    map.set(r.faculty, list);
  }
  return [...map.entries()]
    .map(([name, list]) => [
      name,
      [...list].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
    ] as const)
    .sort((a, b) => (order.get(a[0]) ?? 0) - (order.get(b[0]) ?? 0));
}

const FeesPage = () => {
  const { t } = useLanguage();
  const { data: dbFees, isLoading, isError } = useFees();
  const fees = dbFees ?? [];
  const grouped = useMemo(() => groupFeesByFaculty(fees), [fees]);
  const faculties = grouped.map(([name]) => name);
  const [activeFaculty, setActiveFaculty] = useState<string | null>(null);

  const visibleGroups = useMemo(() => {
    if (!activeFaculty) return grouped;
    return grouped.filter(([name]) => name === activeFaculty);
  }, [grouped, activeFaculty]);

  const formatAmount = (amount: number, currency: string) =>
    `${new Intl.NumberFormat("fr-FR").format(amount)} ${currency}`;

  return (
    <Layout>
      <div className="relative min-h-[240px] overflow-hidden border-b border-border/40 sm:min-h-[280px]">
        <img
          src={heroCampusBg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          fetchPriority="high"
        />
        {/* Voile : image plus discrète, texte bien lisible (pas de motif par-dessus) */}
        <div className="absolute inset-0 bg-black/55" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/92 via-primary/82 to-primary/68" aria-hidden />
        <div className="container relative z-10 mx-auto px-4 py-12 text-primary-foreground sm:py-16">
          <AnimatedSection>
            <div className="mb-6 flex items-center gap-2 text-sm text-primary-foreground/70">
              <Link to="/" className="transition-colors hover:text-primary-foreground">
                {t("nav.home")}
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-80" />
              <span className="font-medium text-primary-foreground/95">{t("fees.title")}</span>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold tracking-tight drop-shadow-sm sm:text-4xl md:text-[2.35rem]">
                      {t("fees.title")}
                    </h1>
                    <CreditCard
                      className="h-8 w-8 shrink-0 text-primary-foreground/90 drop-shadow-sm sm:h-9 sm:w-9 md:h-10 md:w-10"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </div>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
                    {t("fees.subtitle")}
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>

      <section className="bg-background py-12 sm:py-16">
        <div className="container mx-auto max-w-5xl px-4">
          {isLoading && (
            <div className="space-y-8">
              <div className="flex flex-wrap justify-center gap-2">
                <Skeleton className="h-9 w-36 rounded-full" />
                <Skeleton className="h-9 w-28 rounded-full" />
                <Skeleton className="h-9 w-32 rounded-full" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-48 rounded-2xl" />
                <Skeleton className="h-48 rounded-2xl" />
              </div>
            </div>
          )}

          {isError && (
            <AnimatedSection>
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
                <p className="text-destructive">{t("fees.error")}</p>
                <Link to="/contact" className="mt-4 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">
                  {t("footer.contact")}
                </Link>
              </div>
            </AnimatedSection>
          )}

          {!isLoading && !isError && fees.length === 0 && (
            <AnimatedSection>
              <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card px-8 py-14 text-center shadow-sm">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Clock className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <p className="text-base leading-relaxed text-foreground">{t("fees.pendingFinance")}</p>
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Link to="/contact">
                    <Button variant="outline" className="min-w-[200px]">
                      {t("footer.contact")}
                    </Button>
                  </Link>
                </div>
              </div>
            </AnimatedSection>
          )}

          {!isLoading && !isError && fees.length > 0 && (
            <>
              <AnimatedSection>
                <div className="mb-10 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFaculty(null)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      !activeFaculty
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border border-border bg-card text-muted-foreground hover:border-primary/25 hover:text-foreground"
                    }`}
                  >
                    {t("fees.allFaculties")}
                  </button>
                  {faculties.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setActiveFaculty(name === activeFaculty ? null : name)}
                      className={`max-w-[min(100%,280px)] truncate rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        activeFaculty === name
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-border bg-card text-muted-foreground hover:border-primary/25 hover:text-foreground"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </AnimatedSection>

              <div className="space-y-6">
                {visibleGroups.map(([faculty, rows], fi) => {
                  const pdfUrl = rows.find((r) => r.pdf_url)?.pdf_url ?? undefined;
                  return (
                    <AnimatedSection key={faculty} delay={fi * 0.05}>
                      <article className="bg-card border border-border overflow-hidden hover:shadow-lg transition-shadow group">
                        <div className="flex items-center gap-3 border-b border-border/80 bg-muted/40 px-5 py-4 sm:px-6">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/10 text-primary">
                            <GraduationCap className="h-5 w-5" strokeWidth={1.75} />
                          </div>
                          <h2 className="min-w-0 flex-1 text-base font-semibold leading-snug text-foreground sm:text-lg">
                            {faculty}
                          </h2>
                        </div>

                        <div className="divide-y divide-border/80">
                          {rows.map((fee) => (
                            <div key={fee.id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                              <div>
                                <p className="font-medium text-foreground">{fee.cycle}</p>
                                {fee.description ? (
                                  <p className="mt-0.5 text-sm text-muted-foreground">{fee.description}</p>
                                ) : null}
                              </div>
                              <p className="shrink-0 text-lg font-semibold tabular-nums text-primary sm:text-right">
                                {formatAmount(fee.amount, fee.currency)}
                              </p>
                            </div>
                          ))}
                        </div>

                        {pdfUrl ? (
                          <div className="border-t border-border bg-muted/20 px-5 py-3 sm:px-6">
                            <PdfDownloadCard
                              href={pdfUrl}
                              title={t("fees.downloadPdf")}
                              caption={t("fees.pdfCaption")}
                            />
                          </div>
                        ) : null}
                      </article>
                    </AnimatedSection>
                  );
                })}
              </div>

              <AnimatedSection delay={0.15}>
                <div className="mt-12 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-8 text-center">
                  <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("fees.disclaimer")}</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link to="/checkout">
                      <Button className="gap-2 bg-blue-900 hover:bg-blue-800">
                        <CreditCard className="h-4 w-4" />
                        Payer en ligne
                      </Button>
                    </Link>
                    <Link to="/admission">
                      <Button className="gap-2">
                        <GraduationCap className="h-4 w-4" />
                        {t("fees.ctaRegister")}
                      </Button>
                    </Link>
                    <Link to="/contact">
                      <Button variant="outline">{t("fees.ctaContact")}</Button>
                    </Link>
                  </div>
                </div>
              </AnimatedSection>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default FeesPage;
