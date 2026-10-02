import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  Banknote,
  Building2,
  CalendarDays,
  GraduationCap,
  Handshake,
  ImageIcon,
  Library,
  Newspaper,
  Users,
  Video,
  Wrench,
} from 'lucide-react';
import {
  useBlogArticles,
  useCalendarEvents,
  useGallery,
  usePersonnel,
} from '@site/hooks/useSupabaseData';

type DashboardMetric = {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Newspaper;
};

const formatCount = (loading: boolean, failed: boolean, count: number | undefined) => {
  if (loading) return '...';
  if (failed) return '—';
  return count ?? 0;
};

const sections = [
  { label: 'Blog', slug: 'blog', icon: Newspaper },
  { label: 'Personnel', slug: 'personnel', icon: Users },
  { label: 'Collège étudiant', slug: 'college-etudiants', icon: GraduationCap },
  { label: 'Galerie', slug: 'galerie', icon: ImageIcon },
  { label: 'Vidéos', slug: 'videos', icon: Video },
  { label: 'Calendrier', slug: 'calendrier', icon: CalendarDays },
  { label: 'Frais', slug: 'frais', icon: Banknote },
  { label: 'Facultés', slug: 'facultes', icon: Building2 },
  { label: 'Services', slug: 'services', icon: Wrench },
  { label: 'Bibliothèque', slug: 'bibliotheque', icon: Library },
  { label: 'Partenaires', slug: 'partenaires', icon: Handshake },
];

export default function SiteManagementDashboard({ onNavigate }: { onNavigate: (slug: string) => void }) {
  const blogs = useBlogArticles();
  const personnel = usePersonnel();
  const gallery = useGallery();
  const calendar = useCalendarEvents();

  const publishedBlogs = blogs.data?.filter((article) => article.published).length;
  const metrics: DashboardMetric[] = [
    {
      label: 'Articles du blog',
      value: formatCount(blogs.isLoading, blogs.isError, blogs.data?.length),
      detail: blogs.isLoading || blogs.isError ? 'Publications et brouillons' : `${publishedBlogs ?? 0} publié(s)`,
      icon: Newspaper,
    },
    {
      label: 'Personnel',
      value: formatCount(personnel.isLoading, personnel.isError, personnel.data?.length),
      detail: 'Fiches enregistrées',
      icon: Users,
    },
    {
      label: 'Galerie',
      value: formatCount(gallery.isLoading, gallery.isError, gallery.data?.length),
      detail: 'Images enregistrées',
      icon: ImageIcon,
    },
    {
      label: 'Événements',
      value: formatCount(calendar.isLoading, calendar.isError, calendar.data?.length),
      detail: 'Éléments du calendrier',
      icon: CalendarDays,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#497565]">Gestion du site</p>
          <h2 className="mt-1 text-2xl font-bold text-[#20352d]">Tableau de bord</h2>
          <p className="mt-2 text-sm text-muted-foreground">Vue d’ensemble des contenus et accès rapides aux rubriques.</p>
        </div>
        <Button onClick={() => onNavigate('blog')} className="w-full bg-[#205b4b] text-white hover:bg-[#17483b] sm:w-auto">
          <Newspaper className="mr-2 h-4 w-4" /> Gérer les articles
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-[#d9e3dc] shadow-none">
            <CardContent className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#52665c]">{metric.label}</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-[#20352d]">{metric.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
              </div>
              <metric.icon className="h-5 w-5 shrink-0 text-[#497565]" aria-hidden="true" />
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold text-[#20352d]">Rubriques de gestion</h3>
          <p className="mt-1 text-sm text-muted-foreground">Ouvrir une rubrique pour consulter ou modifier son contenu.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <Button
              key={section.slug}
              type="button"
              variant="outline"
              onClick={() => onNavigate(section.slug)}
              className="h-auto min-h-12 justify-between border-[#d9e3dc] bg-white px-3 py-3 text-left text-[#30473d] hover:border-[#9eb9aa] hover:bg-[#f4f8f5]"
            >
              <span className="flex items-center gap-3">
                <section.icon className="h-4 w-4 shrink-0 text-[#497565]" aria-hidden="true" />
                <span>{section.label}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#789286]" aria-hidden="true" />
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
