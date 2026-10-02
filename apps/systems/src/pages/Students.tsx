import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Student } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Check, X, Trash2, Search, CreditCard } from 'lucide-react';
import StudentCard from '@/components/StudentCard';
import ExcelImport from '@/components/ExcelImport';

export default function Students() {
  const { user } = useAuth();
  const canReviewAdmissions = user?.role === 'super_admin' || user?.role === 'appariteur';
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [cardStudent, setCardStudent] = useState<Student | null>(null);

  const load = async () => {
    let q = supabase.from('students').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setStudents((data as Student[]) || []);
  };

  useEffect(() => { load(); }, [filter]);

  const approve = async (student: Student) => {
    if (!canReviewAdmissions) return;
    const matricule = `UPG-${new Date().getFullYear()}-${String(student.id).slice(0, 6).toUpperCase()}`;

    try {
      const { error } = await supabase
        .from('students')
        .update({ status: 'approved', matricule })
        .eq('id', student.id);
      if (error) throw error;
      toast.success(`Étudiant approuvé! Matricule: ${matricule}`);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur validation');
    }
  };

  const reject = async (id: string) => {
    if (!canReviewAdmissions) return;
    try {
      const { error } = await supabase
        .from('students')
        .update({ status: 'rejected' })
        .eq('id', id);
      if (error) throw error;
      toast.info('Inscription rejetée');
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur validation');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (user?.role !== 'super_admin') return;
    if (!confirm('Supprimer cet étudiant?')) return;

    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      toast.success('Étudiant supprimé');
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur suppression');
    }
  };

  const filtered = students.filter(s =>
    `${s.nom} ${s.postnom} ${s.prenom} ${s.matricule} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Gestion des Étudiants</h2>
        {user?.role === 'super_admin' && <ExcelImport onImported={load} />}
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex gap-2">
              {['all', 'pending', 'approved', 'rejected'].map(f => (
                <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
                  {f === 'all' ? 'Tous' : f === 'pending' ? 'En attente' : f === 'approved' ? 'Approuvés' : 'Rejetés'}
                </Button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matricule</TableHead>
                <TableHead>Nom complet</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Filière</TableHead>
                <TableHead>Promotion</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-sm">{s.matricule || '—'}</TableCell>
                  <TableCell className="font-medium">{s.nom} {s.postnom} {s.prenom}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell className="text-sm">{s.filiere}</TableCell>
                  <TableCell>{s.promotion}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === 'approved' ? 'default' : s.status === 'pending' ? 'secondary' : 'destructive'}>
                      {s.status === 'approved' ? 'Approuvé' : s.status === 'pending' ? 'En attente' : 'Rejeté'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {canReviewAdmissions && s.status === 'pending' && (
                        <>
                          <Button size="icon" variant="ghost" onClick={() => approve(s)} title="Approuver">
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => reject(s.id)} title="Rejeter">
                            <X className="h-4 w-4 text-accent" />
                          </Button>
                        </>
                      )}
                      {s.status === 'approved' && user?.role === 'super_admin' && (
                        <Button size="icon" variant="ghost" onClick={() => setCardStudent(s)} title="Carte étudiant">
                          <CreditCard className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                      {user?.role === 'super_admin' && (
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteStudent(s.id)} title="Supprimer">
                          <Trash2 className="h-4 w-4 text-accent" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aucun étudiant trouvé</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Student Card Dialog */}
      <Dialog open={!!cardStudent} onOpenChange={() => setCardStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Carte d'Étudiant</DialogTitle>
          </DialogHeader>
          {cardStudent && <StudentCard student={cardStudent} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
