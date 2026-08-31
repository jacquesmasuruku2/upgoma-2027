import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react';
import logoUpg from '@/assets/logo-upg.jpg';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState<boolean | null>(null);
  const { updatePassword } = useAuth();

  useEffect(() => {
    // Check if we have the access token in the URL
    const accessToken = searchParams.get('access_token');
    if (!accessToken) {
      setValidToken(false);
      toast.error('Token de réinitialisation manquant');
    } else {
      setValidToken(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    const error = await updatePassword(password);
    setLoading(false);

    if (error) {
      toast.error('Erreur: ' + error);
    } else {
      toast.success('Mot de passe réinitialisé avec succès!');
      setTimeout(() => {
        navigate('/login-etudiant');
      }, 2000);
    }
  };

  if (validToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
        <div className="w-full max-w-[400px]">
          <Card className="rounded-xl border-border/80 shadow-xl">
            <CardHeader className="text-center pb-2">
              <XCircle className="h-16 w-16 mx-auto mb-3 text-red-500" />
              <CardTitle className="text-xl font-bold text-foreground">Lien invalide</CardTitle>
              <p className="text-sm text-muted-foreground">
                Le lien de réinitialisation est invalide ou a expiré
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => navigate('/forgot-password')}
                className="w-full"
                variant="outline"
              >
                Demander un nouveau lien
              </Button>
              <Button
                onClick={() => navigate('/login-etudiant')}
                className="w-full"
              >
                Retour à la connexion
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (validToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-[400px]">
        <Card className="rounded-xl border-border/80 shadow-xl">
          <CardHeader className="text-center pb-2">
            <img
              src={logoUpg}
              alt="Logo UPG"
              className="mx-auto mb-3 h-16 w-16 rounded-full object-cover ring-2 ring-primary/20"
            />
            <CardTitle className="text-xl font-bold text-foreground">Université Polytechnique de Goma</CardTitle>
            <p className="text-sm text-muted-foreground">Réinitialiser le mot de passe</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg text-sm text-blue-800 dark:text-blue-200">
              <p className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Entrez votre nouveau mot de passe. Assurez-vous qu'il contient au moins 6 caractères.
                </span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11 rounded-md text-sm font-semibold" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Réinitialiser le mot de passe
              </Button>
            </form>

            <Button
              onClick={() => navigate('/login-etudiant')}
              variant="ghost"
              className="w-full"
              type="button"
            >
              Annuler
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
