import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, Plus } from "lucide-react";
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

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [nestedOpen, setNestedOpen] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: dbFaculties } = useAllFacultyContent();
  const isLgUp = useIsLgUp();

  const facultyLinks = dbFaculties && dbFaculties.length > 0
    ? dbFaculties.map((f: any) => ({ label: f.name, href: `/faculte/${f.slug}` }))
    : defaultFacultyLinks;

  const navItems = [
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
    <nav className="bg-background border-b border-border sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4">
        <Link
          to="/"
          className="flex min-w-0 flex-1 items-center gap-2 lg:flex-initial"
          aria-label="Université Polytechnique de Goma - Accueil"
        >
          <img src={LOGO_UPG_SRC} alt="Logo UPG" className="h-10 w-10 shrink-0 rounded-full object-cover" />
          {/* JS + Tailwind : un seul libellé (évite « UPGUniversité… » si le CSS ne charge pas) */}
          {isLgUp ? (
            <span className="shrink-0 text-sm font-semibold leading-tight text-foreground">
              Université Polytechnique<br />de Goma
            </span>
          ) : (
            <span className="truncate text-lg font-bold tracking-tight text-[hsl(210,70%,25%)] dark:text-[hsl(210,70%,72%)]">
              UPG
            </span>
          )}
        </Link>

        {/* Desktop menu */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) =>
            item.children ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setDropdownOpen(item.label)}
                onMouseLeave={() => setDropdownOpen(null)}
              >
                <button
                  className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-foreground hover:text-[hsl(var(--upg-orange))] transition-all duration-300 rounded-md hover:bg-secondary hover:scale-105"
                  aria-label={`${item.label} - menu déroulant`}
                  aria-expanded={dropdownOpen === item.label}
                  aria-haspopup="true"
                >
                  {item.label}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {dropdownOpen === item.label && (
                  <div className="absolute top-full left-0 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[220px] animate-fade-in">
                    {item.children.map((child, index) =>
                      (child as any).children ? (
                        <div
                          key={child.label}
                          className="relative"
                          onMouseEnter={() => setNestedOpen(child.label)}
                          onMouseLeave={() => setNestedOpen(null)}
                        >
                          <button className="flex w-full items-center justify-between px-4 py-2 text-sm text-foreground hover:bg-secondary hover:text-[hsl(var(--upg-orange))] transition-all duration-300 hover:scale-105">
                            <span>{child.label}</span>
                            <ChevronDown className="h-3 w-3" />
                          </button>
                          {index < item.children.length - 1 && <div className="mx-4 h-px bg-border/50" />}
                          {nestedOpen === child.label && (
                            <div className="absolute right-full top-0 mr-1 min-w-[230px] rounded-lg border border-border bg-card py-1 shadow-lg animate-fade-in">
                              {(child as any).children.map((sub: any, subIndex: number) => (
                                <a
                                  key={sub.label}
                                  href={sub.href}
                                  target="_top"
                                  rel="noopener noreferrer"
                                  className="block px-4 py-2 text-sm text-foreground hover:bg-secondary hover:text-[hsl(var(--upg-orange))] transition-all duration-300 hover:scale-105"
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
                      ) : child.href.startsWith("/#") ? (
                        <>
                          <button
                            key={child.label}
                            onClick={() => handleNavClick(child.href)}
                            className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary hover:text-primary transition-colors"
                          >
                            {child.label}
                          </button>
                          {index < item.children.length - 1 && <div className="mx-4 h-px bg-border/50" />}
                        </>
                      ) : (child as any).external ? (
                        <>
                          <a
                            key={child.label}
                            href={child.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block px-4 py-2 text-sm text-foreground hover:bg-secondary hover:text-[hsl(var(--upg-orange))] transition-all duration-300 hover:scale-105"
                            onClick={() => setDropdownOpen(null)}
                          >
                            {child.label}
                          </a>
                          {index < item.children.length - 1 && <div className="mx-4 h-px bg-border/50" />}
                        </>
                      ) : (
                        <>
                          <Link
                            key={child.label}
                            to={child.href}
                            className="block px-4 py-2 text-sm text-foreground hover:bg-secondary hover:text-[hsl(var(--upg-orange))] transition-all duration-300 hover:scale-105"
                            onClick={() => setDropdownOpen(null)}
                            aria-label={`Naviguer vers ${child.label}`}
                          >
                            {child.label}
                          </Link>
                          {index < item.children.length - 1 && <div className="mx-4 h-px bg-border/50" />}
                        </>
                      )
                    )}
                  </div>
                )}
              </div>
            ) : item.href?.startsWith("/#") ? (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.href!)}
                className="px-3 py-1 text-sm font-medium text-foreground hover:text-[hsl(var(--upg-orange))] transition-all duration-300 rounded-md hover:bg-secondary hover:scale-105"
              >
                {item.label}
              </button>
            ) : (
                        <Link
                          key={item.label}
                          to={item.href!}
                          className="px-3 py-1 text-sm font-medium text-foreground hover:text-[hsl(var(--upg-orange))] transition-all duration-300 rounded-md hover:bg-secondary hover:scale-105"
                          aria-label={`Naviguer vers ${item.label}`}
                        >
                {item.label}
              </Link>
            )
          )}
          <ThemeToggle />
        </div>

        {/* Mobile toggle — shrink-0 pour ne pas être poussé par le logo */}
        <div className="flex shrink-0 items-center gap-1 lg:hidden">
          <ThemeToggle />
          <button
            className="relative p-2 text-foreground hover:bg-accent rounded-lg transition-all duration-200 hover:scale-105"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu principal"
            aria-expanded={mobileOpen}
          >
            <div className="relative w-6 h-6">
              {/* Lignes du menu hamburger */}
              <span className={`absolute left-0 top-1/2 w-6 h-0.5 bg-current transform -translate-y-1/2 transition-all duration-300 ${mobileOpen ? 'rotate-45' : ''}`}></span>
              <span className={`absolute left-0 top-1/2 w-6 h-0.5 bg-current transform -translate-y-1/2 transition-all duration-300 ${mobileOpen ? 'opacity-0' : 'translate-y-1'}`}></span>
              <span className={`absolute left-0 top-1/2 w-6 h-0.5 bg-current transform -translate-y-1/2 transition-all duration-300 ${mobileOpen ? '-rotate-45' : 'translate-y-1'}`}></span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <>
          {/* Overlay sombre */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
          />
          
          {/* Menu slide-in */}
          <div className="lg:hidden fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-background shadow-2xl border-l border-border z-50 animate-slide-in">
            {/* Header du menu mobile */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <img src={LOGO_UPG_SRC} alt="Logo UPG" className="h-8 w-auto" />
                <span className="font-semibold text-foreground">UPG</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
                aria-label="Fermer le menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Contenu du menu */}
            <div className="flex-1 overflow-y-auto p-2">
              {navItems.map((item, index) => (
                <div key={item.label} className={index > 0 ? 'mt-2' : ''}>
                  {/* Séparateur visuel */}
                  {index > 0 && (
                    <div className="mb-2 flex items-center">
                      <div className="flex-1 h-px bg-border"></div>
                      <div className="w-px h-px bg-border"></div>
                      <div className="flex-1 h-px bg-border"></div>
                    </div>
                  )}
                  
                  {/* Élément de menu */}
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => setDropdownOpen(dropdownOpen === item.label ? null : item.label)}
                        className="flex items-center justify-between w-full px-2 py-1 text-sm font-medium text-foreground rounded-lg hover:bg-accent hover:text-[hsl(var(--upg-orange))] transition-all duration-300 hover:scale-105"
                      >
                        <span>{item.label}</span>
                        <Plus className={`w-4 h-4 transition-transform ${dropdownOpen === item.label ? 'rotate-45' : ''}`} />
                      </button>
                      
                      {dropdownOpen === item.label && (
                        <div className="mt-1 space-y-1">
                          {item.children.map((child) => (
                            <div key={child.label} className="ml-2">
                              {(child as any).children ? (
                                <div>
                                  <button
                                    onClick={() => setNestedOpen(nestedOpen === child.label ? null : child.label)}
                                    className="flex items-center justify-between w-full px-2 py-1 text-sm text-muted-foreground hover:text-[hsl(var(--upg-orange))] rounded-lg transition-all duration-300 hover:scale-105"
                                  >
                                    <span>{child.label}</span>
                                    <Plus className={`w-3 h-3 transition-transform ${nestedOpen === child.label ? 'rotate-45' : ''}`} />
                                  </button>
                                  
                                  {nestedOpen === child.label && (
                                    <div className="mt-1 space-y-1">
                                      {(child as any).children.map((sub: any) => (
                                        <a
                                          key={sub.label}
                                          href={sub.href}
                                          target="_top"
                                          rel="noopener noreferrer"
                                          className="block px-2 py-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                                          onClick={() => {
                                            setMobileOpen(false);
                                            setDropdownOpen(null);
                                            setNestedOpen(null);
                                          }}
                                        >
                                          <span className="flex items-center gap-1">
                                            <span>{sub.label}</span>
                                            <div className="w-1 h-1 bg-primary rounded-full"></div>
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
                                  className="block text-left px-3 py-1 text-sm text-muted-foreground hover:text-[hsl(var(--upg-orange))] transition-all duration-300 hover:scale-105"
                                >
                                  {child.label}
                                </button>
                              ) : (child as any).external ? (
                                <a
                                  key={child.label}
                                  href={child.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between px-3 py-1 text-sm text-muted-foreground hover:text-[hsl(var(--upg-orange))] transition-all duration-300 hover:scale-105"
                                  onClick={() => setMobileOpen(false)}
                                >
                                  <span>{child.label}</span>
                                  <div className="w-2 h-2 bg-accent rounded"></div>
                                </a>
                              ) : (
                                <Link
                                  key={child.label}
                                  to={child.href}
                                  className="flex items-center justify-between px-3 py-1 text-sm text-muted-foreground hover:text-[hsl(var(--upg-orange))] transition-all duration-300 hover:scale-105"
                                  onClick={() => setMobileOpen(false)}
                                >
                                  <span>{child.label}</span>
                                  <div className="w-2 h-2 bg-accent rounded"></div>
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
                      className="w-full px-4 py-3 text-sm font-medium text-foreground rounded-lg hover:bg-accent hover:text-[hsl(var(--upg-orange))] transition-all duration-300 hover:scale-105"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      key={item.label}
                      to={item.href!}
                      className="flex items-center justify-between w-full px-2 py-1 text-sm font-medium text-foreground rounded-lg hover:bg-accent hover:text-[hsl(var(--upg-orange))] transition-all duration-300 hover:scale-105"
                      onClick={() => setMobileOpen(false)}
                    >
                      <span>{item.label}</span>
                      <div className="w-2 h-2 bg-accent rounded"></div>
                    </Link>
                  )}
                </div>
              ))}
            </div>
            
            {/* Séparateur bas + Réseaux sociaux */}
            <div className="mt-4">
              <div className="flex items-center">
                <div className="flex-1 h-px bg-border"></div>
                <div className="w-px h-px bg-border"></div>
                <div className="flex-1 h-px bg-border"></div>
              </div>
              <div className="mt-3 flex items-center justify-center gap-3">
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
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;
