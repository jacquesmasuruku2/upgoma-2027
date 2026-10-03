import { Fragment, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAllFacultyContent } from "@/hooks/useSupabaseData";
import { useIsLgUp } from "@/hooks/use-mobile";
import ThemeToggle from "./ThemeToggle";
import { LOGO_UPG_SRC } from "@/lib/brand";
import "@/styles/animations.css"; // Force redeploy for commit 083ec5f - 2026-05-03

const defaultFacultyLinks = [
  { label: "Polytechnique", href: "/faculte/polytechnique" },
  { label: "Sciences Économiques", href: "/faculte/sciences-economiques" },
  { label: "Santé Publique", href: "/faculte/sante-publique" },
  { label: "Management", href: "/faculte/management" },
  { label: "Sciences de Développement", href: "/faculte/sciences-developpement" },
  { label: "Sciences Agronomiques", href: "/faculte/sciences-agronomiques" },
];

type NavMenuItem = {
  label: string;
  href?: string;
  external?: boolean;
  children?: NavMenuItem[];
};

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [nestedOpen, setNestedOpen] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: dbFaculties } = useAllFacultyContent();
  const isLgUp = useIsLgUp();

  useEffect(() => {
    const closeMenus = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setDropdownOpen(null);
        setNestedOpen(null);
      }
    };
    window.addEventListener("keydown", closeMenus);
    return () => window.removeEventListener("keydown", closeMenus);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const desktopViewport = window.matchMedia("(min-width: 1280px)");
    const closeMobileMenu = () => {
      if (desktopViewport.matches) setMobileOpen(false);
    };
    desktopViewport.addEventListener("change", closeMobileMenu);
    return () => desktopViewport.removeEventListener("change", closeMobileMenu);
  }, []);

  const facultyLinks: NavMenuItem[] = dbFaculties && dbFaculties.length > 0
    ? dbFaculties.map((faculty) => ({ label: faculty.name, href: `/faculte/${faculty.slug}` }))
    : defaultFacultyLinks;

  const navItems: NavMenuItem[] = [
    { label: t("nav.home"), href: "/" },
    {
      label: "Présentation",
      children: [
        { label: "À propos", href: "/about" },
        { label: t("nav.admission"), href: "/#admission" },
        { label: "Foire Aux Questions", href: "/faq" },
        { label: "Nos Services", href: "/services" },
        { label: "Partenaires", href: "/partenaires" },
      ],
    },
    { label: t("nav.blog"), href: "/blog" },
    {
      label: "Medias",
      children: [
        { label: "Galerie Images", href: "/galerie" },
        { label: "Nos Vidéos", href: "/videos" },
      ],
    },
    { label: t("nav.personnel"), href: "/personnel" },
    {
      label: t("nav.faculties"),
      children: facultyLinks,
    },
    {
      label: t("nav.student"),
      children: [
        { label: t("nav.student.college"), href: "/college-etudiants" },
        { label: t("nav.student.inscription"), href: "/admission" },
        { label: "Valve", href: "/valve" },
        {
          label: "Outils",
          children: [
            { label: "Connexion étudiant", href: "https://system.upgoma.org/login-etudiant" },
            { label: "Vérification de l'étudiant", href: "/systeme-academique/index.html?start=/outils" },
          ],
        },
      ],
    },
    { label: t("nav.contact"), href: "/contact" },
  ];

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    setDropdownOpen(null);
    setNestedOpen(null);
    if (href.startsWith("/#")) {
      const id = href.slice(2);
      if (location.pathname === "/") {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate("/");
        setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
    }
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-border border-t-2 border-t-upg-sky bg-background/95 shadow-sm backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4">
        <Link
          to="/"
          className="flex min-w-0 flex-1 items-center gap-2 xl:flex-initial"
          aria-label="Université Polytechnique de Goma - Accueil"
        >
          <img src={LOGO_UPG_SRC} alt="Logo UPG" className="h-10 w-10 shrink-0 rounded-full object-cover" />
          {/* JS + Tailwind : un seul libellé (évite « UPGUniversité… » si le CSS ne charge pas) */}
          {isLgUp ? (
            <span className="shrink-0 text-sm font-semibold leading-tight text-foreground">
              Université Polytechnique<br />de Goma
            </span>
          ) : (
            <span className="truncate text-lg font-bold tracking-tight text-[hsl(var(--upg-dark))] dark:text-[hsl(210,70%,72%)]">
              UPG
            </span>
          )}
        </Link>

        {/* Desktop menu */}
        <div className="hidden xl:flex items-center gap-0.5">
          {navItems.map((item) =>
            item.children ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setDropdownOpen(item.label)}
                onMouseLeave={() => {
                  setDropdownOpen(null);
                  setNestedOpen(null);
                }}
              >
                <button
                  onClick={() => setDropdownOpen(item.label)}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-2 text-sm font-medium transition-colors duration-200 hover:bg-upg-sky-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-upg-sky ${dropdownOpen === item.label ? "bg-upg-sky-light text-primary" : "text-foreground"}`}
                  aria-label={`${item.label} - menu déroulant`}
                  aria-expanded={dropdownOpen === item.label}
                  aria-haspopup="true"
                >
                  {item.label}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${dropdownOpen === item.label ? "rotate-180" : ""}`} />
                </button>
                {dropdownOpen === item.label && (
                  <div className="absolute left-0 top-full min-w-[15rem] rounded-xl border border-border bg-card p-1.5 shadow-xl animate-fade-in">
                    {item.children.map((child, index) =>
                      child.children ? (
                        <div
                          key={child.label}
                          className="relative"
                          onMouseEnter={() => setNestedOpen(child.label)}
                          onMouseLeave={() => setNestedOpen(null)}
                        >
                          <button
                            onClick={() => setNestedOpen(nestedOpen === child.label ? null : child.label)}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-upg-sky-light hover:text-primary"
                            aria-expanded={nestedOpen === child.label}
                          >
                            <span>{child.label}</span>
                            <ChevronDown className="h-3 w-3" />
                          </button>
                          {index < item.children.length - 1 && <div className="mx-4 h-px bg-border/50" />}
                          {nestedOpen === child.label && (
                            <div className="absolute right-full top-0 mr-2 min-w-[15rem] rounded-xl border border-border bg-card p-1.5 shadow-xl animate-fade-in">
                              {child.children.map((sub) => (
                                <a
                                  key={sub.label}
                                  href={sub.href}
                                  target="_top"
                                  rel="noopener noreferrer"
                                  className="block rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-upg-sky-light hover:text-primary"
                                  onClick={() => {
                                    setDropdownOpen(null);
                                    setNestedOpen(null);
                                  }}
                                >
                                  {sub.label}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : child.href?.startsWith("/#") ? (
                        <Fragment key={child.label}>
                          <button
                            onClick={() => handleNavClick(child.href!)}
                            className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-upg-sky-light hover:text-primary"
                          >
                            {child.label}
                          </button>
                          {index < item.children.length - 1 && <div className="mx-4 h-px bg-border/50" />}
                        </Fragment>
                      ) : child.external ? (
                        <Fragment key={child.label}>
                          <a
                            href={child.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-upg-sky-light hover:text-primary"
                            onClick={() => setDropdownOpen(null)}
                          >
                            {child.label}
                          </a>
                          {index < item.children.length - 1 && <div className="mx-4 h-px bg-border/50" />}
                        </Fragment>
                      ) : (
                        <Fragment key={child.label}>
                          <Link
                            to={child.href ?? "#"}
                            className="block rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-upg-sky-light hover:text-primary"
                            onClick={() => setDropdownOpen(null)}
                            aria-label={`Naviguer vers ${child.label}`}
                          >
                            {child.label}
                          </Link>
                          {index < item.children.length - 1 && <div className="mx-4 h-px bg-border/50" />}
                        </Fragment>
                      )
                    )}
                  </div>
                )}
              </div>
            ) : item.href?.startsWith("/#") ? (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.href!)}
                className="rounded-md px-2.5 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-upg-sky-light hover:text-primary"
              >
                {item.label}
              </button>
            ) : (
                        <Link
                          key={item.label}
                          to={item.href!}
                          className={`rounded-md px-2.5 py-2 text-sm font-medium transition-colors duration-200 hover:bg-upg-sky-light hover:text-primary ${location.pathname === item.href ? "bg-upg-sky-light text-primary" : "text-foreground"}`}
                          aria-label={`Naviguer vers ${item.label}`}
                        >
                {item.label}
              </Link>
            )
          )}
          <ThemeToggle />
        </div>

        {/* Mobile toggle — shrink-0 pour ne pas être poussé par le logo */}
        <div className="flex shrink-0 items-center gap-1 xl:hidden">
          <ThemeToggle />
          <button
            className="rounded-lg p-2 text-foreground transition-colors hover:bg-upg-sky-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-upg-sky"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu principal"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && createPortal(
        <>
          {/* Overlay sombre */}
          <div 
            className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm xl:hidden animate-fade-in"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
          />
          
          {/* Menu slide-in */}
          <aside className="fixed inset-y-0 right-0 z-50 flex w-[min(22rem,90vw)] flex-col border-l border-border bg-background shadow-2xl xl:hidden animate-slide-in" role="dialog" aria-modal="true" aria-label="Menu principal">
            {/* Header du menu mobile */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <img src={LOGO_UPG_SRC} alt="Logo UPG" className="h-8 w-auto" />
                <span className="font-semibold text-foreground">UPG</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 transition-colors hover:bg-upg-sky-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-upg-sky"
                aria-label="Fermer le menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Contenu du menu */}
            <div className="flex-1 overflow-y-auto px-4 py-5">
              <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Navigation
              </div>
              <div className="space-y-1">
              {navItems.map((item) => (
                <div key={item.label}>
                  {/* Élément de menu */}
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => setDropdownOpen(dropdownOpen === item.label ? null : item.label)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-upg-sky-light hover:text-primary ${dropdownOpen === item.label ? "bg-upg-sky-light text-primary" : "text-foreground"}`}
                        aria-expanded={dropdownOpen === item.label}
                      >
                        <span>{item.label}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen === item.label ? "rotate-180" : ""}`} />
                      </button>
                      
                      {dropdownOpen === item.label && (
                        <div className="ml-3 mt-1 space-y-1 border-l border-upg-sky/30 pl-2">
                          {item.children.map((child) => (
                            <div key={child.label} className="ml-2">
                              {child.children ? (
                                <div>
                                  <button
                                    onClick={() => setNestedOpen(nestedOpen === child.label ? null : child.label)}
                                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-upg-sky-light hover:text-primary"
                                    aria-expanded={nestedOpen === child.label}
                                  >
                                    <span>{child.label}</span>
                                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${nestedOpen === child.label ? "rotate-180" : ""}`} />
                                  </button>
                                  
                                  {nestedOpen === child.label && (
                                    <div className="ml-3 mt-1 space-y-1 border-l border-border pl-2">
                                      {child.children.map((sub) => (
                                        <a
                                          key={sub.label}
                                          href={sub.href ?? "#"}
                                          target="_top"
                                          rel="noopener noreferrer"
                                          className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-upg-sky-light hover:text-primary"
                                          onClick={() => {
                                            setMobileOpen(false);
                                            setDropdownOpen(null);
                                            setNestedOpen(null);
                                          }}
                                        >
                                          <span className="flex items-center gap-1">
                                            <span>{sub.label}</span>
                                          </span>
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : child.href?.startsWith("/#") ? (
                                <button
                                  key={child.label}
                                  onClick={() => handleNavClick(child.href)}
                                  className="block rounded-md px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-upg-sky-light hover:text-primary"
                                >
                                  {child.label}
                                </button>
                              ) : child.external ? (
                                <a
                                  key={child.label}
                                  href={child.href ?? "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-upg-sky-light hover:text-primary"
                                  onClick={() => setMobileOpen(false)}
                                >
                                  <span>{child.label}</span>
                                </a>
                              ) : (
                                <Link
                                  key={child.label}
                                  to={child.href ?? "#"}
                                  className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-upg-sky-light hover:text-primary"
                                  onClick={() => setMobileOpen(false)}
                                >
                                  <span>{child.label}</span>
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : item.href?.startsWith("/#") ? (
                    <button
                      key={item.label}
                      onClick={() => handleNavClick(item.href!)}
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-upg-sky-light hover:text-primary"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      key={item.label}
                      to={item.href!}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-upg-sky-light hover:text-primary ${location.pathname === item.href ? "bg-upg-sky-light text-primary" : "text-foreground"}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <span>{item.label}</span>
                    </Link>
                  )}
                </div>
              ))}
              </div>
            </div>
            
            {/* Séparateur bas + Réseaux sociaux */}
            <div className="border-t border-border px-5 py-4">
              <div className="flex items-center justify-center gap-3">
                <a
                  href="https://cd.linkedin.com/company/universit%C3%A9-polytechnique-de-goma"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn UPG"
                  className="w-8 h-8 rounded-full bg-accent flex items-center justify-center hover:bg-primary/20 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M20.447 20.452H16.89v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.345V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.369-1.85 3.604 0 4.27 2.372 4.27 5.455v6.286zM5.337 7.433a2.063 2.063 0 11.001-4.127 2.063 2.063 0 01-.001 4.127zM7.119 20.452H3.552V9h3.567v11.452z" />
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/upgoma/?locale=fr_FR"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook UPG"
                  className="w-8 h-8 rounded-full bg-accent flex items-center justify-center hover:bg-primary/20 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.6 1.6-1.6h1.7V3.8c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 4v2.2H8v3h2.7v8h2.8z" />
                  </svg>
                </a>
              </div>
            </div>
          </aside>
        </>,
        document.body,
      )}
    </nav>
  );
};

export default Navbar;
