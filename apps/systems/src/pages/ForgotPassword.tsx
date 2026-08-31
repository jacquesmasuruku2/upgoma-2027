import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import logoUpg from '@/assets/logo-upg.jpg';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Veuillez entrer votre email');
      return;
    }

    setLoading(true);
    const error = await resetPassword(email);
    setLoading(false);

    if (error) {
      toast.error('Erreur: ' + error);
    } else {
      setSent(true);
      toast.success('Email de réinitialisation envoyé avec succès!');
    }
  };

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
            <p className="text-sm text-muted-foreground">
              {sent ? 'Email envoyé' : 'Réinitialiser le mot de passe'}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {!sent ? (
              <>
                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                  <p className="flex items-start gap-2">
                    <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                    </span>
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      required
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 rounded-md text-sm font-semibold" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Envoyer le lien de réinitialisation
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                  <Mail className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Un email de réinitialisation a été envoyé à <strong>{email}</strong>
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                    Vérifiez votre boîte de réception et cliquez sur le lien pour réinitialiser votre mot de passe.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setSent(false);
                    setEmail('');
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Envoyer un autre email
                </Button>
              </div>
            )}

            <Link
              to="/login-etudiant"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
