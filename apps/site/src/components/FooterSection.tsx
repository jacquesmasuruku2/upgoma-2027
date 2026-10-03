import { useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Send, Loader2 } from "lucide-react";
import { LOGO_UPG_SRC } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 1200 1227" className="w-4 h-4" fill="currentColor">
    <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M23.5 6.2a3.03 3.03 0 0 0-2.13-2.14C19.48 3.5 12 3.5 12 3.5s-7.48 0-9.37.56A3.03 3.03 0 0 0 .5 6.2 31.8 31.8 0 0 0 0 12a31.8 31.8 0 0 0 .5 5.8 3.03 3.03 0 0 0 2.13 2.14c1.89.56 9.37.56 9.37.56s7.48 0 9.37-.56a3.03 3.03 0 0 0 2.13-2.14A31.8 31.8 0 0 0 24 12a31.8 31.8 0 0 0-.5-5.8ZM9.6 15.58V8.42L15.84 12 9.6 15.58Z" />
  </svg>
);

/** encodeURIComponent : espaces en %20 (lisibles dans le mail) */
const designerMailSubject = "Demande de service de conception de Site Web";
const designerMailBody = `Bonjour Jacques MASURUKU, j'ai visité le site de l'Université Polytechnique de Goma que tu as conçu, je souhaite savoir si tu peux concevoir aussi pour mon entreprise un site moderne.

Merci,  

`;

const designerMailtoHref = `mailto:jacquesmasuruku2@gmail.com?subject=${encodeURIComponent(designerMailSubject)}&body=${encodeURIComponent(designerMailBody)}`;

/**
 * Le mailto s'ouvre dans un nouvel onglet : l’onglet du site reste affiché.
 * L’iframe ne déclenchait pas correctement le client mail sur plusieurs navigateurs.
 */
function openDesignerMail(e: MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
  window.open(designerMailtoHref, "_blank", "noopener,noreferrer");
}

const quickLinks = [
  { label: "nav.home", href: "/" },
  { label: "nav.about", href: "/about" },
  { label: "nav.admission", href: "/admission" },
  { label: "nav.blog", href: "/blog" },
  { label: "nav.personnel", href: "/personnel" },
  { label: "nav.contact", href: "/contact" },
  { label: "nav.faq", href: "/faq" },
  { label: "Vérification de l'étudiant", href: "/systeme-academique/index.html?start=/outils" },
];

/** Première lettre en majuscule, tout le reste en minuscules (slogan footer). */
function capitalizeFirstRestLower(s: string): string {
  const trimmed = s.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toLocaleUpperCase() + trimmed.slice(1).toLocaleLowerCase();
}

const FooterSection = () => {
  const [nlName, setNlName] = useState("");
  const [nlEmail, setNlEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const { data: services } = useQuery({
    queryKey: ["services-footer"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services" as any).select("*").eq("published", true).order("display_order");
      if (error) throw error;
      return data as any[];
    },
  });

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlName.trim() || !nlEmail.trim()) return;
    setLoading(true);
    try {
      const payload = { name: nlName.trim(), email: nlEmail.trim() };
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Impossible de traiter l’inscription newsletter.");

      toast.success(data?.message || "Un email de confirmation vous a été envoyé !");
      setNlName("");
      setNlEmail("");
    } catch (err: any) {
      const raw = String(err?.message || "");
      toast.error(raw || "Une erreur est survenue. Réessayez.");
      console.error("[newsletter] subscribe failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-[hsl(var(--upg-dark))] text-white">
      {/* Orange top accent line */}
      <div className="h-1 w-full bg-upg-sky" />

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-start gap-3 sm:gap-4 mb-3">
              <img
                src={LOGO_UPG_SRC}
                alt="Logo UPG"
                className="h-14 w-14 sm:h-[4.5rem] sm:w-[4.5rem] shrink-0 object-contain mt-0.5"
              />
              <p className="text-sm sm:text-base font-medium text-white leading-snug max-w-[11rem] sm:max-w-[12.5rem] md:max-w-[13.5rem]">
                {capitalizeFirstRestLower(t("footer.tagline"))}
              </p>
            </div>
            <div className="mb-4 h-0.5 w-20 bg-upg-sky sm:w-24" />
            <p className="text-white/60 text-sm leading-relaxed">
              L'Université Polytechnique de Goma (UPG) est un établissement d'enseignement supérieur et universitaire engagé dans la formation de cadres compétents pour le développement durable de la RDC.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href="https://www.facebook.com/upgoma/?locale=fr_FR" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#1877F2] flex items-center justify-center hover:bg-[#1877F2]/80 transition-colors text-white">
                <FacebookIcon />
              </a>
              <a href="https://cd.linkedin.com/company/universit%C3%A9-polytechnique-de-goma" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#0A66C2] flex items-center justify-center hover:bg-[#0A66C2]/80 transition-colors text-white">
                <LinkedInIcon />
              </a>
              <a href="https://x.com/UP_Goma" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-white">
                <XIcon />
              </a>
              <a href="https://www.youtube.com/@Universit%C3%A9PolytechniquedeGoma" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#FF0000] flex items-center justify-center hover:bg-[#FF0000]/85 transition-colors text-white">
                <YouTubeIcon />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-1">
              {t("footer.quicklinks")}
            </h4>
            <div className="mb-4 h-0.5 w-10 bg-upg-sky" />
            <ul className="space-y-0">
              {quickLinks.map((l, i) => (
                <li key={l.label}>
                  {l.label.startsWith("nav.") ? (
                    <Link to={l.href} className="block border-b border-dashed border-white/15 py-2 text-sm text-white/65 transition-colors hover:text-upg-sky">
                      {t(l.label)}
                    </Link>
                  ) : (
                    <a
                      href={l.href}
                      target="_top"
                      rel="noopener noreferrer"
                      className="block border-b border-dashed border-white/15 py-2 text-sm text-white/65 transition-colors hover:text-upg-sky"
                    >
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Nos Services */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-1">
              NOS SERVICES
            </h4>
            <div className="mb-4 h-0.5 w-10 bg-upg-sky" />
            <ul className="space-y-0">
              {(services || []).map((s: any) => (
                <li key={s.id}>
                  <Link to={`/service/${s.slug}`} className="block border-b border-dashed border-white/15 py-2 text-sm text-white/65 transition-colors hover:text-upg-sky">
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + Newsletter */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-1">
              {t("footer.contact")}
            </h4>
            <div className="mb-4 h-0.5 w-10 bg-upg-sky" />
            <ul className="space-y-0 text-white/60 text-sm">
              <li className="flex items-start gap-2 py-2 border-b border-dashed border-white/15">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-upg-sky" />
                Goma, Quartier Lac Vert, Avenue Nyarutsiru, Avant entrée Buhimba
              </li>
              <li className="flex items-center gap-2 py-2 border-b border-dashed border-white/15">
                <Phone className="h-4 w-4 shrink-0 text-upg-sky" />
                +1 613-261-2229
              </li>
              <li className="flex items-center gap-2 py-2 border-b border-dashed border-white/15">
                <Mail className="h-4 w-4 shrink-0 text-upg-sky" />
                info@upgoma.org
              </li>
            </ul>

            <h4 className="font-bold text-sm uppercase tracking-wider text-white mt-6 mb-1">
              {t("footer.newsletter")}
            </h4>
            <div className="mb-3 h-0.5 w-10 bg-upg-sky" />
            <form onSubmit={handleNewsletter} className="space-y-2">
              <Input
                value={nlName}
                onChange={(e) => setNlName(e.target.value)}
                placeholder="Votre nom"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-9 text-sm"
              />
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={nlEmail}
                  onChange={(e) => setNlEmail(e.target.value)}
                  placeholder="Votre email"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-9 text-sm"
                />
                <Button type="submit" size="sm" className="shrink-0 bg-upg-sky text-[hsl(var(--upg-dark))] hover:bg-upg-sky/90" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-[hsl(215,55%,13%)]">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-white/50 text-xs">
          <p>{t("footer.copyright")}</p>
          <Link to="/politique-de-confidentialite" className="underline underline-offset-2 transition-colors hover:text-upg-sky">
            Politique de confidentialité
          </Link>
          <span className="inline-flex flex-wrap items-center justify-center gap-x-0.5">
            <span>{t("footer.designedPrefix")}</span>
            <a
              href={designerMailtoHref}
              onClick={openDesignerMail}
              className="text-white/70 underline-offset-2 transition-colors hover:text-upg-sky hover:underline"
              title="Contacter par e-mail"
            >
              {t("footer.designedName")}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
