import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Chrome, Facebook, Loader2, ArrowRight } from 'lucide-react';
import logoUpg from '@/assets/logo-upg.jpg';
import { toast } from 'sonner';

export default function StudentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, loginWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate(user.role === 'etudiant' ? '/system/portail' : '/system/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const error = await login(email, password, 'etudiant');
    setSubmitting(false);
    if (error) {
      toast.error('Identifiants incorrects. Vérifiez votre email et matricule.');
    } else {
      toast.success('Connexion réussie!');
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const error = await loginWithGoogle();
    setGoogleLoading(false);
    if (error) {
      toast.error('Erreur de connexion Google: ' + error);
    }
  };

  const handleFacebookSignIn = async () => {
    toast.error('Connexion Facebook non implémentée pour le moment');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white rounded-2xl shadow-lg border-0">
          <CardContent className="p-8 space-y-6">
            {/* Header with logo and title */}
            <div className="text-center space-y-4">
              <img
                src={logoUpg}
                alt="Logo UPG"
                className="mx-auto h-20 w-20 object-contain"
              />
              <h1 className="text-3xl font-serif text-blue-900 font-bold">Connexion</h1>
            </div>

            {/* Social login buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleGoogleSignIn}
                variant="outline"
                className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Chrome className="h-5 w-5 mr-2" />
                )}
                Google
              </Button>
              <Button
                onClick={handleFacebookSignIn}
                variant="outline"
                className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Facebook className="h-5 w-5 mr-2" />
                Facebook
              </Button>
            </div>

            {/* Separator */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">ou</span>
              </div>
            </div>

            {/* Subtitle and links */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">Se connecter avec un mot de passe</h2>
              <p className="text-sm text-gray-600">
                Vous n'avez pas de compte ?{' '}
                <a
                  href="http://localhost:8080/admission"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Créez-en un.
                </a>
              </p>
              <Link
                to="/forgot-password"
                className="block text-sm text-blue-600 hover:underline"
              >
                Connectez-vous sans mot de passe.
              </Link>
            </div>

            {/* Form fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Adresse e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="etudiant@upgoma.org"
                  required
                  className="h-12 rounded-lg border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Matricule ou Mot de passe"
                    required
                    className="h-12 rounded-lg border-gray-300 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="text-right">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
              </div>

              {/* Main action button */}
              <Button
                type="submit"
                className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold text-left px-6"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <>
                    Confirmer
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

