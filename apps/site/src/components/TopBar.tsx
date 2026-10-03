import { useState, useEffect, useCallback, useMemo } from "react";
import { Mail, Phone, Languages, Banknote, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

/** 7,5 s pour Frais puis 7,5 s pour Admission ; la barre sous le texte utilise la même durée. */
const TOPBAR_PROMO_ROTATE_MS = 7500;

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
  const [visible, setVisible] = useState(true);
  const [selectedLang, setSelectedLang] = useState("fr");
  const [promoSlot, setPromoSlot] = useState(0);
  const { t } = useLanguage();

  const promoItems = useMemo(
    () => [
      { to: "/frais" as const, label: t("topbar.fees"), Icon: Banknote },
      { to: "/admission" as const, label: t("topbar.inscription"), Icon: GraduationCap },
    ],
    [t],
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setPromoSlot((s) => (s + 1) % promoItems.length);
    }, TOPBAR_PROMO_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [promoItems.length]);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY < 80);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

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
    <div
      className={`bg-[hsl(210,70%,25%)] text-white text-xs sm:text-sm transition-all duration-500 z-50 ${
        visible ? "opacity-100" : "h-0 opacity-0 overflow-hidden"
      }`}
    >
      <div className="container mx-auto flex min-h-16 flex-nowrap items-center justify-between gap-2 px-4 py-2 sm:gap-3 md:gap-x-4 overflow-x-auto [scrollbar-width:thin]">
        <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2 sm:gap-3 md:gap-x-4">
          {/* Grille : largeur plafonnée pour laisser la colonne droite sur la même ligne. */}
          <div
            className="inline-grid shrink-0 place-items-stretch max-w-[min(22rem,calc(100vw_-_14rem))] sm:max-w-[min(22rem,calc(100vw_-_15rem))]"
            style={{ gridTemplateColumns: "minmax(0, max-content)" }}
            aria-live="polite"
            aria-atomic="true"
          >
            {promoItems.map((item) => {
              const Icon = item.Icon;
              return (
                <span
                  key={`promo-sizer-${item.to}`}
                  className="invisible col-start-1 row-start-1 flex w-full min-w-0 max-w-full items-center gap-1.5 whitespace-nowrap rounded-md px-1.5 py-1 sm:px-1 sm:py-0.5"
                  aria-hidden
                >
                  <span className="inline-flex shrink-0 rounded-md bg-white/15 p-0.5 ring-1 ring-white/25">
                    <Icon className="h-4 w-4 text-white sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" strokeWidth={2} />
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                </span>
              );
            })}
            <div className="col-start-1 row-start-1 relative isolate flex min-h-8 items-center self-stretch sm:min-h-7">
              {promoItems.map((item, i) => {
                const active = promoSlot === i;
                const Icon = item.Icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    title={item.label}
                    className={cn(
                      "absolute left-0 top-1/2 inline-flex w-full min-w-0 max-w-full -translate-y-1/2 flex-row items-center gap-1.5 whitespace-nowrap rounded-md px-1.5 py-1 outline-none ring-offset-2 ring-offset-[hsl(210,70%,25%)] transition-all duration-700 ease-out sm:px-1 sm:py-0.5",
                      "bg-white/10 ring-1 ring-white/20 sm:bg-transparent sm:ring-0",
                      "focus-visible:ring-2 focus-visible:ring-white/60",
                      active
                        ? "z-10 translate-x-0 opacity-100"
                        : "pointer-events-none z-0 translate-x-2 opacity-0",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex shrink-0 rounded-md bg-white/15 p-0.5 ring-1 ring-white/25 transition-transform duration-700",
                        active ? "scale-100" : "scale-90",
                      )}
                      aria-hidden
                    >
                      <Icon className="h-4 w-4 text-white sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" strokeWidth={2} />
                    </span>
                    <span className="relative inline-block min-w-0 max-w-full shrink text-sm font-medium underline-offset-2 transition-colors hover:underline">
                      <span className="block max-w-full truncate">{item.label}</span>
                      {active && (
                        <span
                          className="pointer-events-none absolute -bottom-0.5 left-0 h-0.5 w-full origin-left rounded-full bg-white/75"
                          style={{
                            animation: `topbar-promo-underline ${TOPBAR_PROMO_ROTATE_MS}ms linear infinite`,
                          }}
                          aria-hidden
                        />
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="hidden h-4 w-px shrink-0 bg-white/30 md:block" aria-hidden />
          <Link
            to="/bibliotheque"
            className="hover:underline whitespace-nowrap hidden max-w-[10rem] truncate md:inline-block lg:max-w-none"
            title={t("topbar.library")}
          >
            {t("topbar.library")}
          </Link>
          <span className="opacity-40 hidden md:inline" aria-hidden>
            |
          </span>
          <a
            href="https://system.upgoma.org/login-etudiant"
            className="hover:underline whitespace-nowrap hidden shrink-0 md:inline"
          >
            {t("topbar.login")}
          </a>
        </div>
        <div className="flex shrink-0 flex-nowrap items-center justify-end gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 rounded-md border border-white/25 bg-white/10 px-2 py-1 h-8">
            <Languages className="w-3.5 h-3.5 text-white/90 shrink-0" />
            <label htmlFor="topbar-language" className="sr-only">Choisir la langue</label>
            <select
              id="topbar-language"
              className="bg-transparent text-white text-[11px] sm:text-xs font-medium outline-none cursor-pointer min-w-[104px]"
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
          <a href="tel:+16132612229" className="hidden sm:flex items-center gap-1 hover:underline">
            <Phone className="w-3 h-3" />
            <span>+1 613-261-2229</span>
          </a>
          <a
            href="https://cd.linkedin.com/company/universit%C3%A9-polytechnique-de-goma"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn UPG"
            className="w-7 h-7 rounded-full bg-white border border-white/80 flex items-center justify-center hover:bg-white/90 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="#0A66C2" aria-hidden="true">
              <path d="M20.447 20.452H16.89v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.345V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.369-1.85 3.604 0 4.27 2.372 4.27 5.455v6.286zM5.337 7.433a2.063 2.063 0 11.001-4.127 2.063 2.063 0 01-.001 4.127zM7.119 20.452H3.552V9h3.567v11.452z" />
            </svg>
          </a>
          <a
            href="https://www.facebook.com/upgoma/?locale=fr_FR"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook UPG"
            className="w-7 h-7 rounded-full bg-white border border-white/80 flex items-center justify-center hover:bg-white/90 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="#1877F2" aria-hidden="true">
              <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.6 1.6-1.6h1.7V3.8c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 4v2.2H8v3h2.7v8h2.8z" />
            </svg>
          </a>
          <a href="mailto:info@upgoma.org" className="hidden sm:flex items-center gap-1 hover:underline">
            <Mail className="w-3 h-3" />
            <span>info@upgoma.org</span>
          </a>
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
