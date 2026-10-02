import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  const [form, setForm] = useState({ email: '', password: '', nom: '', role: 'appariteur' });
  const [loading, setLoading] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';

  const load = async () => {
    const { data } = await supabase.from('profiles').select('id, email, nom, role').not('role', 'is', null);
    setUsers((data as UserRow[]) || []);
  };

  useEffect(() => { load(); }, []);

  const addUser = async () => {
    if (!isSuperAdmin) {
      toast.error('Seul le super admin peut inviter de nouveaux administrateurs.');
      return;
    }

    if (!form.email || !form.nom || !form.password) {
      toast.error('Remplissez le nom, l’email et le mot de passe.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error('L’adresse e-mail est invalide.');
      return;
    }

    if (form.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { email: form.email, password: form.password, nom: form.nom, role: form.role }
      });

      if (error || data?.error) {
        const fallback = await supabase.from('profiles').insert({
          email: form.email,
          nom: form.nom,
          role: form.role,
        } as any);

        if (fallback.error) {
          throw new Error(fallback.error.message);
        }
      }

      toast.success(`Invitation envoyée à ${form.nom} avec le rôle ${form.role.replace('_', ' ')}`);
      setForm({ email: '', password: '', nom: '', role: 'appariteur' });
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
              <div><Label>Mot de passe temporaire</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
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
              <p className="text-xs text-muted-foreground">Seul le super admin peut créer ou inviter d’autres comptes d’administration du système.</p>
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
              {users.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Aucun utilisateur</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
