import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { inviteAdminUser, type AdminInvitationInput } from '@/lib/adminApi';
import { authRequest } from '@/lib/authApi';

interface UserRow {
  id: string;
  email: string;
  nom: string;
  role: string | null;
}

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: '', nom: '', role: 'appariteur' as AdminInvitationInput['role'] });
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);

  const isSuperAdmin = user?.role === 'super_admin';

  const load = async () => {
    setUsersLoading(true);
    try {
      const { users: rows } = await authRequest<{ users: UserRow[] }>('/api/admin/users');
      setUsers(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de charger les utilisateurs.');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addUser = async () => {
    if (!isSuperAdmin) {
      toast.error('Seul le super admin peut inviter de nouveaux administrateurs.');
      return;
    }

    if (!form.email || !form.nom) {
      toast.error('Remplissez le nom et l’adresse e-mail.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error('L’adresse e-mail est invalide.');
      return;
    }

    setLoading(true);
    try {
      await inviteAdminUser({ name: form.nom, email: form.email, role: form.role });
      toast.success(`Invitation envoyée à ${form.email}.`);
      setForm({ email: '', nom: '', role: 'appariteur' });
      setOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de l’invitation de l’utilisateur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Utilisateurs</h2>
          <p className="text-sm text-muted-foreground">
            {isSuperAdmin ? 'Le super admin peut inviter et gérer les comptes administrateurs.' : 'Vous ne pouvez pas inviter de nouveaux admins.'}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={!isSuperAdmin}>
              <Plus className="h-4 w-4 mr-1" /> Inviter un admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Inviter un administrateur</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nom complet</Label><Input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div>
                <Label>Rôle</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="appariteur">Appariteur</SelectItem>
                    <SelectItem value="enseignant">Enseignant</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">L’invitation contient un lien sécurisé pour définir le mot de passe.</p>
              <Button onClick={addUser} disabled={loading || !isSuperAdmin} className="w-full">{loading ? 'Invitation...' : 'Créer l\'invitation'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nom}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'super_admin' ? 'destructive' : 'default'}>
                      {u.role?.replace('_', ' ') || 'Non défini'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!usersLoading && users.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Aucun utilisateur</TableCell></TableRow>
              )}
              {usersLoading && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Chargement...</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
