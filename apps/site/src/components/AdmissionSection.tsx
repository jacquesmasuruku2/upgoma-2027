import { ArrowRight, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import AnimatedSection from "./AnimatedSection";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";

export type AdmissionSectionProps = { variant?: "section" | "page" };

const AdmissionSection = ({ variant = "section" }: AdmissionSectionProps) => {
  const { t } = useLanguage();
  const isPage = variant === "page";
  const HeadingTag = isPage ? "h1" : "h2";

  return (
    <section id={isPage ? undefined : "admission"} className="py-16 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        {isPage && (
          <nav className="mb-8" aria-label="Fil d'Ariane">
            <Link to="/" className="text-sm font-medium text-primary hover:underline">
              ← {t("admission.back")}
            </Link>
          </nav>
        )}

        <AnimatedSection>
          <div className="text-center mb-12">
            <HeadingTag
              className={`font-bold text-primary mb-3 ${isPage ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"}`}
            >
              {t("admission.title")}
            </HeadingTag>
            <p className="text-muted-foreground">{t("admission.subtitle")}</p>
            <blockquote className="mt-4 text-foreground italic max-w-xl mx-auto text-sm sm:text-base">
              {t("admission.quote")}
            </blockquote>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Left — Online Registration */}
            <div className="border border-border p-8 flex flex-col justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                  {t("admission.onlineTitle")}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("admission.onlineDesc")}
                </p>
              </div>
              <Link
                to="/admission"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
              >
                {t("admission.ctaForm")}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Payment Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-8 flex flex-col justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-blue-700 mb-3">
                  Paiement en ligne
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Effectuez vos frais d'admission et autres paiements en toute sécurité via notre caisse virtuelle.
                </p>
              </div>
              <Link
                to="/checkout"
                className="mt-6"
              >
                <Button className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Passer à la caisse
                </Button>
              </Link>
            </div>

            {/* Right — Required Documents */}
            <div className="border border-border p-8 flex items-center">
              <div className="space-y-5 w-full">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                  Pièces à fournir
                </p>
                <div className="flex items-start gap-4">
                  <span className="text-xl font-light text-muted-foreground/40">01</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Diplôme d'État</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Ou tout document équivalent (format PDF).</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-xl font-light text-muted-foreground/40">02</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Bulletins scolaires</p>
                    <p className="text-xs text-muted-foreground mt-0.5">5ème et 6ème année des Humanités.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-xl font-light text-muted-foreground/40">03</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Attestations</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Naissance et bonne vie et mœurs.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-xl font-light text-muted-foreground/40">04</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Photos passeport</p>
                    <p className="text-xs text-muted-foreground mt-0.5">4 photos récentes.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-xl font-light text-muted-foreground/40">05</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Certificat médical</p>
                    <p className="text-xs text-muted-foreground mt-0.5">D'aptitude physique.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default AdmissionSection;
