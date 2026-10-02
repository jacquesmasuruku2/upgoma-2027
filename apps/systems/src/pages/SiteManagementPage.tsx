import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import logoUpg from '@/assets/logo-upg.jpg';
import AdminPage from '@site/pages/AdminPage';
import SiteManagementDashboard from '@/pages/SiteManagementDashboard';
import Settings from '@/pages/Settings';

const SECTION_BY_SLUG: Record<string, string> = {
  dashboard: 'dashboard',
  accueil: 'dashboard',
  personnel: 'personnel',
  team: 'personnel',
  blog: 'blog',
  blogs: 'blog',
  college: 'college',
  'college-etudiants': 'college',
  'student-council': 'college',
  galerie: 'galerie',
  gallery: 'galerie',
  video: 'videos',
  videos: 'videos',
  calendrier: 'calendrier',
  calendar: 'calendrier',
  events: 'calendrier',
  frais: 'frais',
  fees: 'frais',
  faculte: 'facultes',
  facultes: 'facultes',
  faculty: 'facultes',
  faculties: 'facultes',
  service: 'services',
  services: 'services',
  bibliotheque: 'bibliotheque',
  library: 'bibliotheque',
  partenaire: 'partenaires',
  partenaires: 'partenaires',
  partner: 'partenaires',
  partners: 'partenaires',
  parametres: 'settings',
  newsletter: 'newsletter',
};

const CANONICAL_SLUG_BY_SECTION: Record<string, string> = {
  dashboard: 'dashboard',
  personnel: 'personnel',
  blog: 'blog',
  college: 'college-etudiants',
  galerie: 'galerie',
  videos: 'videos',
  calendrier: 'calendrier',
  frais: 'frais',
  facultes: 'facultes',
  services: 'services',
  bibliotheque: 'bibliotheque',
  partenaires: 'partenaires',
  newsletter: 'newsletter',
};

export default function SiteManagementPage() {
  const { user, loading } = useAuth();
  const { section } = useParams<{ section?: string }>();
  const navigate = useNavigate();
  const sectionSlug = section?.toLowerCase();
  const activeSection = sectionSlug ? SECTION_BY_SLUG[sectionSlug] : undefined;

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;
  }

  if (!import.meta.env.DEV && user?.role !== 'super_admin') {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Accès réservé</h1>
        <p className="text-muted-foreground">Seul le super administrateur peut gérer le contenu du site.</p>
        <Button variant="outline" onClick={() => window.location.assign('/login')}>
          Se connecter comme super administrateur
        </Button>
      </div>
    );
  }

  if (activeSection === 'settings') return <Settings />;

  if (!activeSection) {
    return <Navigate to="/gestion-site/dashboard" replace />;
  }

  return (
    <AdminPage
      authorized={import.meta.env.DEV || user?.role === 'super_admin'}
      logoSrc={logoUpg}
      activeSection={activeSection}
      onOpenAcademic={() => navigate('/system/dashboard')}
      dashboard={<SiteManagementDashboard onNavigate={(slug) => navigate(`/gestion-site/${slug}`)} />}
      onSectionChange={(nextSection) => {
        const slug = CANONICAL_SLUG_BY_SECTION[nextSection] ?? 'personnel';
        navigate(`/gestion-site/${slug}`);
      }}
    />
  );
}
