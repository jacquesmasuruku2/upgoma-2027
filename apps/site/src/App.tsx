import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import TopBar from "@/components/TopBar";
import { LanguageProvider } from "@/i18n/LanguageContext";
import Index from "./pages/Index";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import PersonnelPage from "./pages/PersonnelPage";
import BlogPage from "./pages/BlogPage";
import CollegeEtudiantsPage from "./pages/CollegeEtudiantsPage";
import AboutPage from "./pages/AboutPage";
import AdminPage from "./pages/AdminPage";
import GalleryPage from "./pages/GalleryPage";
import FeesPage from "./pages/FeesPage";
import FacultyPage from "./pages/FacultyPage";
import LibraryPage from "./pages/LibraryPage";
import ServicePage from "./pages/ServicePage";
import ServicesPage from "./pages/ServicesPage";
import VideosPage from "./pages/VideosPage";
import AcademicSystemPage from "./pages/AcademicSystemPage";
import NotFound from "./pages/NotFound";
import ConfirmNewsletter from "./pages/ConfirmNewsletter";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import AdmissionSuccessPage from "./pages/AdmissionSuccessPage";
import PartnersPage from "./pages/PartnersPage";
import ValvePage from "./pages/ValvePage";
import GrilleDeliberationPage from "./pages/GrilleDeliberationPage";
import CheckoutPage from "./pages/CheckoutPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import CheckoutCancelPage from "./pages/CheckoutCancelPage";
import Seo from "@/components/Seo";
import StructuredData from "@/components/StructuredData";
import AdminAuthRedirect from "@/components/AdminAuthRedirect";

/** Chunk séparé : une erreur sur le formulaire d’admission ne doit pas bloquer tout le site. */
const AdmissionPage = lazy(() => import("./pages/AdmissionPage"));

const queryClient = new QueryClient();

const RouteChangeTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== "function") return;

    const pagePath = `${location.pathname}${location.search}${location.hash}`;
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    window.gtag("event", "page_view", {
      page_location: window.location.href,
      page_path: pagePath,
      page_title: document.title,
      debug_mode: isLocalhost,
    });
  }, [location.pathname, location.search, location.hash]);

  return null;
};

/** TopBar une seule fois (évite de recréer Google Translate à chaque changement de route). */
const PublicChrome = () => {
  const { pathname } = useLocation();
  const hideTopBar = pathname.startsWith("/admin") || 
                      pathname.startsWith("/checkout") ||
                      pathname.startsWith("/admission");
  return (
    <>
      {/* Toujours monté : masqué sur /admin, /checkout et /admission pour éviter les conflits DOM avec Google Translate */}
      <div className={hideTopBar ? "hidden" : undefined} aria-hidden={hideTopBar}>
        <TopBar />
      </div>
      <AdminAuthRedirect />
      <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/personnel" element={<PersonnelPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/college-etudiants" element={<CollegeEtudiantsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route
              path="/admission"
              element={
                <Suspense
                  fallback={
                    <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
                      Chargement…
                    </div>
                  }
                >
                  <AdmissionPage />
                </Suspense>
              }
            />
            <Route path="/galerie" element={<GalleryPage />} />
            <Route path="/videos" element={<VideosPage />} />
            <Route path="/frais" element={<FeesPage />} />
            <Route path="/faculte/:slug" element={<FacultyPage />} />
            <Route path="/bibliotheque" element={<LibraryPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/service/:slug" element={<ServicePage />} />
            <Route path="/systeme-academique" element={<AcademicSystemPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admission-success" element={<AdmissionSuccessPage />} />
            <Route path="/confirmer-newsletter" element={<ConfirmNewsletter />} />
            <Route path="/politique-de-confidentialite" element={<PrivacyPolicyPage />} />
            <Route path="/partenaires" element={<PartnersPage />} />
            <Route path="/valve" element={<ValvePage />} />
            <Route path="/grille-deliberation" element={<GrilleDeliberationPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/checkout-success" element={<CheckoutSuccessPage />} />
            <Route path="/checkout-cancel" element={<CheckoutCancelPage />} />
            <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Seo />
          <StructuredData />
          <RouteChangeTracker />
          <PublicChrome />
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
