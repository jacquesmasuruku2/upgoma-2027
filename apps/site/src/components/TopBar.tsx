import { useState, useEffect, useCallback, useMemo } from "react";
import { Mail, Phone, Languages, Banknote, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

const TRANSLATE_SCRIPT_ID = "google-translate-script";
const TRANSLATE_CB = "googleTranslateElementInit";

function clearGoogTransCookies() {
  try {
    const host = window.location.hostname;
    const rootDomain = host.replace(/^www\./, "");
    const expires = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = `googtrans=;path=/;${expires}`;
    document.cookie = `googtrans=;path=/;domain=${host};${expires}`;
    document.cookie = `googtrans=;path=/;domain=.${host};${expires}`;
    document.cookie = `googtrans=;path=/;domain=.${rootDomain};${expires}`;
  } catch {
    /* cookies désactivés / navigation restreinte — ne pas bloquer l’UI */
  }
}

const TopBar = () => {
  const [selectedLang, setSelectedLang] = useState("fr");
  const { t } = useLanguage();

  const promoItems = useMemo(
    () => [
      { to: "/frais" as const, label: t("topbar.fees"), Icon: Banknote },
      { to: "/admission" as const, label: t("topbar.inscription"), Icon: GraduationCap },
    ],
    [t],
  );

  /** Même effet qu’en navigation privée : forcer l’affichage si Google Translate ou un cache laisse le corps masqué. */
  useEffect(() => {
    const ensureChromeVisible = () => {
      try {
        document.body.style.setProperty("visibility", "visible", "important");
        document.body.style.setProperty("top", "0", "important");
        document.body.style.setProperty("position", "relative", "important");
        const root = document.getElementById("root");
        if (root) {
          root.style.setProperty("visibility", "visible", "important");
          root.style.setProperty("opacity", "1", "important");
          root.style.setProperty("display", "block", "important");
        }
      } catch {
        /* ignore */
      }
    };
    ensureChromeVisible();
    const t1 = window.setTimeout(ensureChromeVisible, 400);
    const t2 = window.setTimeout(ensureChromeVisible, 2000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    const initWidget = () => {
      const container = document.getElementById("google_translate_element");
      if (!container || container.childElementCount > 0) return;
      if (!window.google?.translate?.TranslateElement) return;
      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "fr",
            includedLanguages: "fr,en,sw,es,pt,ar,zh-CN,de",
            layout: window.google.translate.TranslateElement.InlineLayout.HORIZONTAL,
            autoDisplay: false,
          },
          "google_translate_element"
        );
      } catch {
        /* widget déjà présent ou limite Google */
      }
    };

    window.googleTranslateElementInit = initWidget;

    const existing = document.getElementById(TRANSLATE_SCRIPT_ID) as HTMLScriptElement | null;
    if (window.google?.translate?.TranslateElement) {
      initWidget();
      return;
    }
    if (existing?.src) {
      const poll = window.setInterval(() => {
        if (window.google?.translate?.TranslateElement) {
          window.clearInterval(poll);
          initWidget();
        }
      }, 100);
      const stop = window.setTimeout(() => window.clearInterval(poll), 15000);
      return () => {
        window.clearInterval(poll);
        window.clearTimeout(stop);
      };
    }

    const script = document.createElement("script");
    script.id = TRANSLATE_SCRIPT_ID;
    script.async = true;
    script.src = `https://translate.google.com/translate_a/element.js?cb=${TRANSLATE_CB}`;
    try {
      document.body.appendChild(script);
    } catch {
      /* réseau / CSP / bloqueur */
    }

    return undefined;
  }, []);

  const handleLanguageChange = useCallback((lang: string) => {
    setSelectedLang(lang);

    const apply = () => {
      const googleSelect = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
      if (!googleSelect) return false;

      if (lang === "fr") {
        clearGoogTransCookies();
        document.documentElement.classList.remove("translated-ltr", "translated-rtl");
        const opts = Array.from(googleSelect.options);
        const empty = opts.find((o) => !o.value || o.value === "");
        if (empty) {
          googleSelect.value = empty.value;
        } else {
          googleSelect.selectedIndex = 0;
        }
        googleSelect.dispatchEvent(new Event("change", { bubbles: true }));
        window.setTimeout(() => window.location.reload(), 50);
        return true;
      }

      const match =
        Array.from(googleSelect.options).find(
          (o) =>
            o.value === lang ||
            o.value.endsWith(`|${lang}`) ||
            o.value.includes(`/${lang}`) ||
            o.value.startsWith(`${lang}|`)
        ) ?? Array.from(googleSelect.options).find((o) => o.value && o.value.split(/[|/]/).includes(lang));

      if (match) {
        googleSelect.value = match.value;
      } else {
        googleSelect.value = lang;
      }
      googleSelect.dispatchEvent(new Event("change", { bubbles: true }));
      googleSelect.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    };

    if (apply()) return;

    let tries = 0;
    const id = window.setInterval(() => {
      tries += 1;
      if (apply() || tries >= 50) window.clearInterval(id);
    }, 100);
  }, []);

  return (
    <div className="relative z-50 border-b border-white/10 bg-[hsl(var(--upg-dark))] text-xs text-white after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-upg-sky sm:text-sm">
      <div className="container mx-auto flex min-h-11 max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2 xl:flex-nowrap">
        <div className="flex min-w-0 flex-1 items-center justify-between gap-x-4 md:justify-start">
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {promoItems.map((item, index) => {
              const Icon = item.Icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:px-3",
                    index === 1
                      ? "bg-upg-sky text-[hsl(var(--upg-dark))] hover:bg-upg-sky/90"
                      : "border border-white/20 text-white hover:bg-white/10",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="hidden h-4 w-px shrink-0 bg-white/30 md:block" aria-hidden />
          <div className="hidden items-center gap-4 md:flex">
            <Link to="/bibliotheque" className="whitespace-nowrap text-white/80 transition-colors hover:text-white">
              {t("topbar.library")}
            </Link>
            <a href="https://system.upgoma.org/login-etudiant" className="whitespace-nowrap text-white/80 transition-colors hover:text-white">
              {t("topbar.login")}
            </a>
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
          <a href="tel:+16132612229" className="hidden items-center gap-1.5 whitespace-nowrap text-white/80 transition-colors hover:text-white xl:flex">
            <Phone className="h-3.5 w-3.5" />
            <span>+1 613-261-2229</span>
          </a>
          <a href="mailto:info@upgoma.org" className="hidden items-center gap-1.5 whitespace-nowrap text-white/80 transition-colors hover:text-white xl:flex">
            <Mail className="h-3.5 w-3.5" />
            <span>info@upgoma.org</span>
          </a>
          <div className="flex h-8 items-center gap-1.5 rounded-md border border-white/20 bg-white/5 px-2">
            <Languages className="h-3.5 w-3.5 shrink-0 text-upg-sky" />
            <label htmlFor="topbar-language" className="sr-only">Choisir la langue</label>
            <select
              id="topbar-language"
              className="min-w-[5.5rem] cursor-pointer bg-transparent text-xs font-medium text-white outline-none"
              value={selectedLang}
              onChange={(e) => handleLanguageChange(e.target.value)}
              aria-label="Choisir la langue du site"
            >
              <option value="fr" className="text-black">Francais</option>
              <option value="en" className="text-black">English</option>
              <option value="sw" className="text-black">Kiswahili</option>
              <option value="es" className="text-black">Espanol</option>
              <option value="pt" className="text-black">Portugues</option>
              <option value="ar" className="text-black">Arabe</option>
              <option value="zh-CN" className="text-black">Chinois</option>
              <option value="de" className="text-black">Allemand</option>
            </select>
            <div id="google_translate_element" className="google-translate-host" aria-hidden="true" />
          </div>
          <div className="hidden items-center gap-1.5 md:flex">
            <a href="https://cd.linkedin.com/company/universit%C3%A9-polytechnique-de-goma" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn UPG" className="flex h-7 w-7 items-center justify-center rounded-full bg-white transition-colors hover:bg-upg-sky">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="#0A66C2" aria-hidden="true">
                <path d="M20.447 20.452H16.89v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.345V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.369-1.85 3.604 0 4.27 2.372 4.27 5.455v6.286zM5.337 7.433a2.063 2.063 0 11.001-4.127 2.063 2.063 0 01-.001 4.127zM7.119 20.452H3.552V9h3.567v11.452z" />
              </svg>
            </a>
            <a href="https://www.facebook.com/upgoma/?locale=fr_FR" target="_blank" rel="noopener noreferrer" aria-label="Facebook UPG" className="flex h-7 w-7 items-center justify-center rounded-full bg-white transition-colors hover:bg-upg-sky">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="#1877F2" aria-hidden="true">
                <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.6 1.6-1.6h1.7V3.8c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 4v2.2H8v3h2.7v8h2.8z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement: {
          new (
            options: {
              pageLanguage: string;
              includedLanguages?: string;
              layout?: unknown;
              autoDisplay?: boolean;
            },
            elementId: string
          ): unknown;
          InlineLayout: {
            SIMPLE: unknown;
            HORIZONTAL: unknown;
          };
        };
      };
    };
  }
}
