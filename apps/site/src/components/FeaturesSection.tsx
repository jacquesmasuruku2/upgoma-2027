import AnimatedSection from "./AnimatedSection";
import { useLanguage } from "@/i18n/LanguageContext";

const FeaturesSection = () => {
  const { t } = useLanguage();

  const features = [
    { title: t("feat.teaching.title"), text: t("feat.teaching.text") },
    { title: t("feat.scholarship.title"), text: t("feat.scholarship.text") },
    { title: t("feat.internet.title"), text: t("feat.internet.text") },
    { title: t("feat.fees.title"), text: t("feat.fees.text") },
  ];

  return (
    <section className="bg-muted/50 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <AnimatedSection key={i} delay={i * 0.15}>
              <div className="group rounded-lg border border-border border-t-2 border-t-upg-sky/70 bg-card p-6 transition-colors duration-300 hover:border-upg-sky">
                <h3 className="mb-2 text-lg font-semibold text-[hsl(var(--upg-dark))] transition-colors group-hover:text-primary">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.text}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
