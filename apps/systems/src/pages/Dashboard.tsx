import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, CreditCard, BookOpen, Clock, TrendingUp, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';

const COLORS = ['#0d47a1', '#1976d2', '#42a5f5', '#90caf9', '#e53935', '#43a047'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ students: 0, pending: 0, payments: 0, courses: 0 });
  const [paymentsByMonth, setPaymentsByMonth] = useState<{ month: string; montant: number }[]>([]);
  const [studentsByFiliere, setStudentsByFiliere] = useState<{ name: string; value: number }[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<{ mention: string; count: number }[]>([]);
  const [registrationTrend, setRegistrationTrend] = useState<{ month: string; count: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const [s, p, pay, c] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('payments').select('montant'),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        students: s.count || 0,
        pending: p.count || 0,
        payments: pay.data?.reduce((sum, r) => sum + Number(r.montant), 0) || 0,
        courses: c.count || 0,
      });

      // Payments by month
      const { data: allPayments } = await supabase.from('payments').select('date, montant');
      if (allPayments) {
        const byMonth: Record<string, number> = {};
        allPayments.forEach((p: any) => {
          const m = p.date?.substring(0, 7) || 'N/A';
          byMonth[m] = (byMonth[m] || 0) + Number(p.montant);
        });
        setPaymentsByMonth(
          Object.entries(byMonth)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6)
            .map(([month, montant]) => ({ month, montant }))
        );
      }

      // Students by filière
      const { data: allStudents } = await supabase.from('students').select('filiere, created_at').eq('status', 'approved');
      if (allStudents) {
        const byFiliere: Record<string, number> = {};
        allStudents.forEach((s: any) => {
          byFiliere[s.filiere] = (byFiliere[s.filiere] || 0) + 1;
        });
        setStudentsByFiliere(Object.entries(byFiliere).map(([name, value]) => ({ name, value })));

        // Registration trend
        const byMonth: Record<string, number> = {};
        allStudents.forEach((s: any) => {
          const m = s.created_at?.substring(0, 7) || 'N/A';
          byMonth[m] = (byMonth[m] || 0) + 1;
        });
        setRegistrationTrend(
          Object.entries(byMonth)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6)
            .map(([month, count]) => ({ month, count }))
        );
      }

      // Grade distribution
      const { data: allGrades } = await supabase.from('grades').select('note').eq('published', true);
      if (allGrades) {
        const dist = { Excellent: 0, 'Très bien': 0, Bien: 0, Passable: 0, Ajourné: 0 };
        allGrades.forEach((g: any) => {
          const n = Number(g.note || 0);
          if (n >= 16) dist.Excellent++;
          else if (n >= 14) dist['Très bien']++;
          else if (n >= 12) dist.Bien++;
          else if (n >= 10) dist.Passable++;
          else dist.Ajourné++;
        });
        setGradeDistribution(Object.entries(dist).map(([mention, count]) => ({ mention, count })));
      }
    };
    load();
  }, []);

  const summaryCards = [
    { label: 'Total Étudiants', value: stats.students, icon: GraduationCap, color: 'text-primary' },
    { label: 'Inscriptions en attente', value: stats.pending, icon: Clock, color: 'text-orange-500' },
    { label: 'Total Paiements ($)', value: stats.payments.toLocaleString(), icon: CreditCard, color: 'text-green-600' },
    { label: 'Cours', value: stats.courses, icon: BookOpen, color: 'text-primary' },
  ];

  const paymentChartConfig: ChartConfig = {
    montant: { label: 'Montant ($)', color: '#0d47a1' },
  };

  const registrationChartConfig: ChartConfig = {
    count: { label: 'Inscriptions', color: '#43a047' },
  };

  const gradeChartConfig: ChartConfig = {
    count: { label: 'Étudiants', color: '#1976d2' },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Tableau de bord</h2>
        <Button variant="outline" onClick={() => navigate('/system/parametres')}>
          <Settings className="mr-2 h-4 w-4" /> Paramètres
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map(c => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={cn("h-5 w-5", c.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Payments by month */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Paiements par mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsByMonth.length > 0 ? (
              <ChartContainer config={paymentChartConfig} className="h-[250px] w-full">
                <BarChart data={paymentsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="montant" fill="var(--color-montant)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">Aucune donnée</p>
            )}
          </CardContent>
        </Card>

        {/* Students by filière */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Étudiants par filière
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studentsByFiliere.length > 0 ? (
              <div className="h-[250px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={studentsByFiliere} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={10}>
                      {studentsByFiliere.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-12">Aucune donnée</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Registration trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> Tendance des inscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {registrationTrend.length > 0 ? (
              <ChartContainer config={registrationChartConfig} className="h-[250px] w-full">
                <LineChart data={registrationTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">Aucune donnée</p>
            )}
          </CardContent>
        </Card>

        {/* Grade distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Répartition des mentions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gradeDistribution.some(g => g.count > 0) ? (
              <ChartContainer config={gradeChartConfig} className="h-[250px] w-full">
                <BarChart data={gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mention" fontSize={10} />
                  <YAxis fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {gradeDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">Aucune donnée</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
