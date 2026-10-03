import { useState } from "react";
import Layout from "@/components/Layout";
import { ArrowUpRight, User, Mail, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import { usePersonnel, usePublishedServiceOptions } from "@/hooks/useSupabaseData";
import AnimatedSection from "@/components/AnimatedSection";
import { useLanguage } from "@/i18n/LanguageContext";

const staticPersonnel = [
  { name: "Jean de Dieu MUTABAZI MUNGUIKO", role: "Recteur", bio: null, photo_url: null, email: null, linkedin_url: null },
  { name: "André MUSAVULI BALIKWISHA", role: "Secrétaire Général Académique", bio: null, photo_url: null, email: null, linkedin_url: null },
  { name: "Claver NDABIJIMANA", role: "Secrétaire Administratif et Financier", bio: null, photo_url: null, email: null, linkedin_url: null },
  { name: "Jacques Masuruku", role: "Informaticien", bio: null, photo_url: null, email: null, linkedin_url: null },
  { name: "Joel SEBAGENI", role: "Appariteur", bio: null, photo_url: null, email: null, linkedin_url: null },
];

const PersonnelPage = () => {
  const { data: dbPersonnel } = usePersonnel();
  const { data: services = [] } = usePublishedServiceOptions();
  const { t } = useLanguage();
  const personnel = dbPersonnel && dbPersonnel.length > 0 ? dbPersonnel : staticPersonnel;
  const [activeId, setActiveId] = useState<string | null>(null);

  const toggleCard = (name: string) => {
    setActiveId((prev) => (prev === name ? null : name));
  };

  return (
    <Layout>
      <section className="bg-gradient-to-r from-primary to-[hsl(210,70%,25%)] py-14">
        <div className="container mx-auto px-4 text-center">
          <AnimatedSection>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              {t("personnel.title")}
            </h1>
            <p className="text-white/70 max-w-lg mx-auto text-sm">
              Les femmes et hommes qui façonnent l'avenir de l'Université Polytechnique de Goma
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="py-14 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {personnel.map((p: any, i: number) => {
              const isActive = activeId === p.name;
              const hasLinks = p.email || p.linkedin_url;
              const serviceSlug = p.service_slug || (p.role?.toLowerCase().includes("recteur") ? "rectorat" : null);
              const linkedService = services.find((service) => service.slug === serviceSlug);
              const serviceHref = linkedService ? `/service/${encodeURIComponent(linkedService.slug)}` : null;
              return (
                <AnimatedSection key={p.name} delay={i * 0.06}>
                  <div
                    className="bg-card border border-border overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => toggleCard(p.name)}
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                      {p.photo_url ? (
                        <img src={p.photo_url} alt={p.name} className="w-full h-full object-contain bg-muted" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                          <User className="w-16 h-16 text-primary/40" />
                        </div>
                      )}

                      {serviceHref && (
                        <Link
                          to={serviceHref}
                          aria-label={`Voir le service ${linkedService.name} lié à ${p.name}`}
                          onClick={(event) => event.stopPropagation()}
                          className="absolute inset-0 z-10"
                        />
                      )}

                      {isActive && hasLinks && (
                        <div className="pointer-events-none absolute inset-0 z-20 bg-black/40 flex items-start pt-5 pl-4 animate-in fade-in duration-200">
                          <div className="flex flex-col gap-2">
                            {p.linkedin_url && (
                              <a
                                href={p.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="pointer-events-auto w-9 h-9 rounded-full bg-[hsl(210,80%,40%)] text-white flex items-center justify-center hover:opacity-80 transition-opacity"
                              >
                                <Linkedin className="w-4 h-4" />
                              </a>
                            )}
                            {p.email && (
                              <a
                                href={`mailto:${p.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="pointer-events-auto w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-80 transition-opacity"
                              >
                                <Mail className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      {serviceHref ? (
                        <Link
                          to={serviceHref}
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex items-center gap-1 font-bold text-foreground text-sm mb-0.5 uppercase hover:text-primary transition-colors"
                        >
                          {p.name}
                          <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                        </Link>
                      ) : (
                        <h3 className="font-bold text-foreground text-sm mb-0.5 uppercase">{p.name}</h3>
                      )}
                      {p.email && (
                        <p className="text-muted-foreground text-xs mb-0.5">{p.email}</p>
                      )}
                      <p className="text-primary text-xs font-medium">{p.role}</p>
                      {linkedService && (
                        <p className="mt-1 text-xs text-muted-foreground">Service : {linkedService.name}</p>
                      )}
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PersonnelPage;
