import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, MailPlus, Save, Settings2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { inviteAdminUser, type AdminInvitationInput } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const roles = [
  { value: 'appariteur', label: 'Appariteur' },
  { value: 'enseignant', label: 'Enseignant' },
  { value: 'finance', label: 'Finance' },
  { value: 'super_admin', label: 'Super administrateur' },
] as const;

const isSecurePassword = (password: string) =>
  password.length >= 12 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);

export default function Settings() {
  const { user, updatePassword } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [invite, setInvite] = useState({ name: '', email: '', role: 'appariteur' as AdminInvitationInput['role'] });
  const [invitePending, setInvitePending] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [passwordPending, setPasswordPending] = useState(false);

  const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInvitePending(true);
    try {
      await inviteAdminUser(invite);
      toast.success(`Invitation envoyée à ${invite.email}.`);
      setInvite({ name: '', email: '', role: 'appariteur' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible d’envoyer l’invitation.');
    } finally {
      setInvitePending(false);
    }
  };

  const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSecurePassword(password)) {
      toast.error('Utilisez au moins 12 caractères, une majuscule, une minuscule, un chiffre et un symbole.');
      return;
    }
    if (password !== confirmation) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }

    setPasswordPending(true);
    const error = await updatePassword(currentPassword, password);
    setPasswordPending(false);
    if (error) {
      toast.error(error);
      return;
    }
    setCurrentPassword('');
    setPassword('');
    setConfirmation('');
    toast.success('Votre mot de passe a été modifié.');
  };

  const returnPath = location.pathname.startsWith('/gestion-site')
    ? '/gestion-site/dashboard'
    : '/system/dashboard';

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Compte et accès</p>
          <h2 className="text-2xl font-bold">Paramètres</h2>
        </div>
        <Button variant="outline" onClick={() => navigate(returnPath)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour au tableau de bord
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="h-5 w-5" /> Mot de passe
          </CardTitle>
          <CardDescription>Modifier le mot de passe de {user?.email || 'votre compte'}.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="settings-current-password">Mot de passe actuel</Label>
              <Input
                id="settings-current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-password">Nouveau mot de passe</Label>
              <Input
                id="settings-password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-password-confirm">Confirmer le mot de passe</Label>
              <Input
                id="settings-password-confirm"
                type="password"
                autoComplete="new-password"
                minLength={12}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              12 caractères minimum, avec majuscule, minuscule, chiffre et symbole.
            </p>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={passwordPending || !currentPassword || !password || !confirmation}>
                <Save className="mr-2 h-4 w-4" />
                {passwordPending ? 'Modification...' : 'Modifier mon mot de passe'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {user?.role === 'super_admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MailPlus className="h-5 w-5" /> Inviter un utilisateur
            </CardTitle>
            <CardDescription>
              La personne recevra un lien sécurisé pour activer son compte et choisir son mot de passe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invite-name">Nom complet</Label>
                <Input
                  id="invite-name"
                  autoComplete="name"
                  maxLength={120}
                  value={invite.name}
                  onChange={(event) => setInvite({ ...invite, name: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-email">Adresse e-mail</Label>
                <Input
                  id="invite-email"
                  type="email"
                  autoComplete="email"
                  value={invite.email}
                  onChange={(event) => setInvite({ ...invite, email: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="invite-role">Rôle</Label>
                <Select value={invite.role} onValueChange={(role: AdminInvitationInput['role']) => setInvite({ ...invite, role })}>
                  <SelectTrigger id="invite-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={invitePending || !invite.name.trim() || !invite.email.trim()}>
                  <Settings2 className="mr-2 h-4 w-4" />
                  {invitePending ? 'Envoi...' : 'Envoyer l’invitation'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}