import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import logoUpg from '@/assets/logo-upg.jpg';
import AdminPage from '@site/pages/AdminPage';

export default function SiteManagementPage() {
  const { user, loading } = useAuth();

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

  return <AdminPage authorized={import.meta.env.DEV || user?.role === 'super_admin'} logoSrc={logoUpg} />;
}
