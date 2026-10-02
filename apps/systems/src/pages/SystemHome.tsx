import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, GraduationCap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SystemHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAcademic = () => navigate(user?.role === 'etudiant' ? '/portail' : '/dashboard');

  return (
    <div className="min-h-screen bg-background px-4 py-10 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">UPG</p>
          <h1 className="text-3xl font-bold md:text-5xl">Choisissez un module</h1>
          <p className="text-muted-foreground mx-auto max-w-2xl">
            Accédez à la gestion académique et au contenu du site web depuis le même espace local.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="group overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 to-background hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <GraduationCap className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl">Système académique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Gestion des étudiants, présences, notes, paiements, cours, demandes et outils administratifs.
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border px-2 py-1">/presences</span>
                <span className="rounded-full border px-2 py-1">/etudiants</span>
                <span className="rounded-full border px-2 py-1">/dashboard</span>
              </div>
              <Button onClick={handleAcademic} className="w-full mt-2">
                Ouvrir le système <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="group overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-background hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white">
                <Building2 className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl">Gestion du site</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Créez et publiez les blogs, gérez le personnel, les facultés, les services et les autres contenus du site.
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border px-2 py-1">Blogs</span>
                <span className="rounded-full border px-2 py-1">Personnel</span>
                <span className="rounded-full border px-2 py-1">Pages et médias</span>
              </div>
              <div>
                <Button variant="secondary" onClick={() => navigate('/gestion-site')} className="w-full">
                  Ouvrir la gestion du site
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
