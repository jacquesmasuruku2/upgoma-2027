import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface UserRow {
  id: string;
  email: string;
  nom: string;
  role: string | null;
}

export default function Users() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', nom: '', role: 'appariteur' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('profiles').select('id, email, nom, role').not('role', 'is', null);
    setUsers((data as UserRow[]) || []);
  };

  useEffect(() => { load(); }, []);

  const addUser = async () => {
    setLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { nom: form.nom } },
      });

      if (signUpError && !/already registered|already exists/i.test(signUpError.message)) {
        throw new Error(signUpError.message);
      }

      const userId = signUpData.user?.id || (await supabase.from('profiles').select('id').eq('email', form.email).maybeSingle()).data?.id;
      if (!userId) {
        throw new Error('Le compte utilisateur n’a pas pu être créé.');
      }

      await supabase.from('user_roles').upsert({ user_id: userId, role: form.role as any });
      await supabase.from('profiles').upsert({
        id: userId,
        email: form.email,
        nom: form.nom,
        role: form.role,
      } as any);

      toast.success(`Utilisateur ${form.nom} ajouté avec succès`);
      setForm({ email: '', password: '', nom: '', role: 'appariteur' });
      setOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Gestion des Utilisateurs</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Ajouter</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouvel Utilisateur</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nom complet</Label><Input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><Label>Mot de passe</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
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
              <p className="text-xs text-muted-foreground">L'utilisateur pourra se connecter directement sans vérification email.</p>
              <Button onClick={addUser} disabled={loading} className="w-full">{loading ? 'Création...' : 'Créer l\'utilisateur'}</Button>
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
