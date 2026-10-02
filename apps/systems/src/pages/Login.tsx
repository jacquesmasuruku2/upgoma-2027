import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Chrome, Eye, EyeOff, GraduationCap, Loader2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import logoUpg from '@/assets/logo-upg.jpg';
import classroomImage from '@site/assets/auditoire-habineza.jpg';
import { toast } from 'sonner';

const roleLabels: Partial<Record<UserRole, string>> = {
  super_admin: 'Super Admin',
  appariteur: 'Appariteur (Admin)',
  enseignant: 'Enseignant (Admin)',
  finance: 'Finance (Admin)',
};

export default function Login() {
  const [role, setRole] = useState<UserRole>('super_admin');
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
    const error = await login(email, password, role);
    setSubmitting(false);
    if (error) {
      toast.error('Identifiants incorrects. Vérifiez votre email et mot de passe.');
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

  return (
    <div className="min-h-screen bg-[#f4f6f2] lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(440px,0.92fr)]">
      <section className="relative isolate flex min-h-[260px] flex-col justify-between overflow-hidden bg-[#173c34] px-6 py-6 text-white sm:min-h-[310px] sm:px-10 lg:min-h-screen lg:px-14 lg:py-10">
        <img
          src={classroomImage}
          alt="Cours dans une salle de classe de l’UPG"
          className="absolute inset-0 z-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 z-10 bg-[#102d28]/75" />

        <div className="relative z-20 flex items-center gap-3">
          <img src={logoUpg} alt="" className="h-12 w-12 rounded-full border border-white/40 object-cover" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/75">Université</p>
            <p className="text-sm font-bold">Polytechnique de Goma</p>
          </div>
        </div>

        <div className="relative z-20 max-w-xl py-8 lg:py-14">
          <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f5c66a]">
            <span className="h-px w-8 bg-[#f5c66a]" /> Espace de gestion
          </p>
          <h1 className="max-w-lg text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            Le savoir ouvre des voies.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/80 sm:text-base">
            Connectez-vous pour accéder aux outils de gestion de l’université.
          </p>
        </div>

        <div className="relative z-20 flex items-center justify-between gap-4 border-t border-white/20 pt-4 text-xs text-white/75">
          <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#f5c66a]" /> Accès sécurisé</span>
          <span>Goma · RDC</span>
        </div>
      </section>

      <main className="flex min-h-[calc(100vh-260px)] items-center justify-center px-5 py-10 sm:px-10 lg:min-h-screen lg:px-14">
        <div className="w-full max-w-[430px]">
          <div className="mb-8">
            <div className="mb-5 inline-flex items-center gap-2 border-b-2 border-[#bd463d] pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#31584d]">
              <LockKeyhole className="h-4 w-4" /> Portail du personnel
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-[#1d302b]">Connexion</h2>
            <p className="mt-2 text-sm leading-6 text-[#61716b]">Accédez à votre espace UPG avec vos identifiants.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="staff-role" className="text-sm font-medium text-[#354840]">Profil d’accès</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger id="staff-role" className="h-12 border-[#d5ddd7] bg-white text-sm shadow-sm focus:ring-[#286b58]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-email" className="text-sm font-medium text-[#354840]">Adresse e-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#79877f]" />
                <Input
                  id="staff-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nom@upgoma.org"
                  required
                  className="h-12 border-[#d5ddd7] bg-white pl-11 shadow-sm placeholder:text-[#9aa69f] focus-visible:ring-[#286b58]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="staff-password" className="text-sm font-medium text-[#354840]">Mot de passe</Label>
                <Link to="/forgot-password" className="text-xs font-medium text-[#286b58] underline-offset-4 hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#79877f]" />
                <Input
                  id="staff-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Saisissez votre mot de passe"
                  required
                  className="h-12 border-[#d5ddd7] bg-white pl-11 pr-12 shadow-sm placeholder:text-[#9aa69f] focus-visible:ring-[#286b58]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-[#64746c] transition-colors hover:text-[#173c34]"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="h-12 w-full bg-[#205b4b] text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#17483b]"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Se connecter
            </Button>
          </form>

          <div className="my-6 flex items-center gap-4 text-xs text-[#7a8781]">
            <span className="h-px flex-1 bg-[#dce2dd]" />
            <span>OU</span>
            <span className="h-px flex-1 bg-[#dce2dd]" />
          </div>

          <Button
            onClick={handleGoogleSignIn}
            variant="outline"
            className="h-12 w-full border-[#d5ddd7] bg-white text-sm font-medium text-[#354840] hover:bg-[#f8faf8]"
            disabled={googleLoading}
          >
            {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Chrome className="mr-2 h-4 w-4" />}
            Continuer avec Google
          </Button>

          <div className="mt-8 border-t border-[#dce2dd] pt-5">
            <Link to="/login-etudiant" className="group flex items-center justify-between gap-4 text-sm text-[#52645b] transition-colors hover:text-[#205b4b]">
              <span className="flex items-center gap-2"><GraduationCap className="h-5 w-5" /> Connexion étudiant</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <p className="mt-8 text-center text-xs text-[#859189]">© {new Date().getFullYear()} Université Polytechnique de Goma</p>
        </div>
      </main>
    </div>
  );
}

