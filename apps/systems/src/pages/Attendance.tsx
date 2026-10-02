import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Course, Student } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Download, QrCode, CheckCircle2 } from 'lucide-react';
import { buildAttendanceReport, type AttendanceReportType } from '@/lib/attendanceReports';

const SESSION_TYPES = [
  { value: 'tp', label: 'TP / Laboratoire' },
  { value: 'cours', label: 'Cours théorique' },
];

const REPORT_TYPES: { value: AttendanceReportType; label: string }[] = [
  { value: 'daily', label: 'Journalier' },
  { value: '3days', label: '3 jours' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
  { value: 'quarterly', label: 'Trimestre' },
  { value: 'course', label: 'Par cours' },
];

interface AttendanceRecord {
  id?: string;
  student_id: string;
  course_id: string;
  session_type: string;
  session_date: string;
  status: 'present' | 'absent';
  qr_code?: string | null;
  validated_by?: string | null;
  created_at?: string | null;
}

export default function Attendance() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [sessionType, setSessionType] = useState('tp');
  const [sessionDate, setSessionDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [qrStudent, setQrStudent] = useState<Student | null>(null);
  const [codeToValidate, setCodeToValidate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<AttendanceReportType>('daily');
  const [reportDate, setReportDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportCourse, setReportCourse] = useState('all');

  const sessionKey = useMemo(
    () => `${selectedCourse}:${sessionType}:${sessionDate}`,
    [selectedCourse, sessionType, sessionDate]
  );

  const loadCourses = async () => {
    const { data, error } = await supabase.from('courses').select('*').order('code');
    if (error) {
      toast.error('Impossible de charger les cours');
      return;
    }
    setCourses((data as Course[]) || []);
  };

  const loadAttendanceRecords = async () => {
    const { data, error } = await supabase.from('attendances').select('*');
    if (error) {
      setAttendanceRecords([]);
      return;
    }
    setAttendanceRecords((data as AttendanceRecord[]) || []);
  };

  const loadStudents = async () => {
    if (!selectedCourse) {
      setStudents([]);
      setAttendance({});
      return;
    }

    const course = courses.find((c) => c.id === selectedCourse);
    if (!course) {
      setStudents([]);
      setAttendance({});
      return;
    }

    const { data: studs, error: studError } = await supabase
      .from('students')
      .select('*')
      .eq('status', 'approved')
      .eq('filiere', course.filiere)
      .eq('promotion', course.promotion)
      .order('nom', { ascending: true });

    if (studError) {
      toast.error('Impossible de charger les étudiants');
      return;
    }

    setStudents((studs as Student[]) || []);

    const { data: records, error: attendanceErr } = await supabase
      .from('attendances')
      .select('*')
      .eq('course_id', selectedCourse)
      .eq('session_type', sessionType)
      .eq('session_date', sessionDate);

    if (attendanceErr) {
      setAttendanceError('Table attendances manquante ou inaccessible. Créez-la dans Supabase.');
      setAttendance({});
      return;
    }

    const map: Record<string, AttendanceRecord> = {};
    (records as AttendanceRecord[] || []).forEach((record) => {
      map[record.student_id] = record;
    });

    setAttendance(map);
    setAttendanceError(null);
  };

  useEffect(() => {
    loadCourses();
    loadAttendanceRecords();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [selectedCourse, sessionType, sessionDate, courses]);

  const reportData = useMemo(() => {
    return buildAttendanceReport(attendanceRecords, {
      reportType,
      anchorDate: new Date(reportDate),
      courseId: reportCourse === 'all' ? undefined : reportCourse,
      courses,
    });
  }, [attendanceRecords, reportType, reportDate, reportCourse, courses]);

  const changeStatus = (studentId: string, status: 'present' | 'absent') => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {
          student_id: studentId,
          course_id: selectedCourse,
          session_type: sessionType,
          session_date: sessionDate,
          status,
        }),
        status,
        course_id: selectedCourse,
        session_type: sessionType,
        session_date: sessionDate,
      },
    }));
  };

  const saveAttendance = async () => {
    if (!selectedCourse) {
      toast.error('Sélectionnez un cours.');
      return;
    }

    setLoading(true);
    const payload = Object.values(attendance).map((record) => ({
      ...record,
      validated_by: user?.id || null,
    }));

    const { error } = await supabase.from('attendances').upsert(payload as any, { onConflict: 'course_id,student_id,session_date,session_type' });
    setLoading(false);
    if (error) {
      toast.error('Impossible d’enregistrer la présence.');
      return;
    }
    toast.success('Présences enregistrées');
    loadStudents();
    loadAttendanceRecords();
  };

  const buildQrCodeValue = (studentId: string) =>
    `attendance:${selectedCourse}:${studentId}:${sessionType}:${sessionDate}`;

  const validateQrCode = async () => {
    if (!codeToValidate || !selectedCourse) {
      toast.error('Entrez un code QR et sélectionnez un cours.');
      return;
    }

    const parts = codeToValidate.split(':');
    if (parts.length !== 5 || parts[0] !== 'attendance') {
      toast.error('Code QR invalide');
      return;
    }

    const [_, courseId, studentId, codeSessionType, codeDate] = parts;
    if (courseId !== selectedCourse || codeSessionType !== sessionType || codeDate !== sessionDate) {
      toast.error('Ce QR ne correspond pas à la session sélectionnée.');
      return;
    }

    changeStatus(studentId, 'present');
    setCodeToValidate('');
    toast.success('Présence validée');
  };

  const downloadInterrogationList = () => {
    if (!selectedCourse) {
      toast.error('Sélectionnez un cours pour télécharger la liste.');
      return;
    }

    const rows = [
      ['Matricule', 'Nom complet', 'Filière', 'Promotion', 'Présence'],
      ...students.map((student) => [
        student.matricule || '',
        `${student.nom} ${student.postnom} ${student.prenom}`,
        student.filiere,
        student.promotion,
        attendance[student.id]?.status === 'present' ? 'Présent' : 'Absent',
      ]),
    ];

    const csv = rows.map((row) => row.map((col) => `"${String(col).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `liste-interrogation-${selectedCourse}-${sessionDate}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const reportRows = reportType === 'course' ? reportData.courseBreakdown : reportData.periods;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="grid gap-4 md:grid-cols-3 flex-1">
          <div>
            <Label>Cours</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger><SelectValue placeholder="Choisir un cours" /></SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} — {course.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Type de session</Label>
            <Select value={sessionType} onValueChange={setSessionType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SESSION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date de la séance</Label>
            <Input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-2 md:w-72">
          <Button variant="secondary" onClick={downloadInterrogationList} className="w-full">
            <Download className="h-4 w-4 mr-2" /> Télécharger la liste d’interrogation
          </Button>
          <Button onClick={saveAttendance} disabled={!selectedCourse || loading} className="w-full">
            <CheckCircle2 className="h-4 w-4 mr-2" /> Enregistrer les présences
          </Button>
        </div>
      </div>

      {attendanceError ? (
        <Card className="border border-destructive/20 bg-destructive/5">
          <CardContent>
            <p className="text-destructive">{attendanceError}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Validation QR et présences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Code QR de validation</Label>
                <Input
                  value={codeToValidate}
                  onChange={(e) => setCodeToValidate(e.target.value)}
                  placeholder="Collez le code QR ici"
                />
              </div>
              <Button onClick={validateQrCode} className="self-end md:self-auto">
                <QrCode className="h-4 w-4 mr-2" /> Valider le code QR
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Pour les TP et laboratoires, chaque étudiant utilise le QR de sa carte ou la chaîne de validation correspondante.
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Rapports de présence</CardTitle>
              <p className="text-sm text-muted-foreground">Période : {reportData.rangeLabel}</p>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <Select value={reportType} onValueChange={(value) => setReportType(value as AttendanceReportType)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="w-[180px]" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
              <p className="mt-2 text-2xl font-bold">{reportData.summary.total}</p>
            </div>
            <div className="rounded-xl border bg-emerald-500/10 p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-700">Présents</p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{reportData.summary.present}</p>
            </div>
            <div className="rounded-xl border bg-red-500/10 p-4">
              <p className="text-xs uppercase tracking-wide text-red-700">Absents</p>
              <p className="mt-2 text-2xl font-bold text-red-700">{reportData.summary.absent}</p>
            </div>
            <div className="rounded-xl border bg-primary/10 p-4">
              <p className="text-xs uppercase tracking-wide text-primary">Taux</p>
              <p className="mt-2 text-2xl font-bold text-primary">{reportData.summary.rate}%</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{reportType === 'course' ? 'Cours' : 'Période'}</TableHead>
                    <TableHead>Présents</TableHead>
                    <TableHead>Absents</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Taux</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Aucune donnée de présence pour cette période.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reportRows.map((row: any) => (
                      <TableRow key={reportType === 'course' ? row.courseId : row.start}>
                        <TableCell>{reportType === 'course' ? row.courseName : row.label}</TableCell>
                        <TableCell>{row.present}</TableCell>
                        <TableCell>{row.absent}</TableCell>
                        <TableCell>{row.total}</TableCell>
                        <TableCell>{row.rate}%</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-2">
              <Label>Filtre par cours</Label>
              <Select value={reportCourse} onValueChange={setReportCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les cours" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les cours</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>{course.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Liste des étudiants</CardTitle>
              <p className="text-sm text-muted-foreground">
                {students.length} étudiant{students.length > 1 ? 's' : ''} pour ce cours
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Session: {SESSION_TYPES.find((t) => t.value === sessionType)?.label}</Badge>
              <Badge variant="outline">Date: {format(new Date(sessionDate), 'dd/MM/yyyy')}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matricule</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Filière</TableHead>
                <TableHead>Présence</TableHead>
                <TableHead>QR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const record = attendance[student.id];
                const status = record?.status || 'absent';
                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono text-sm">{student.matricule || '—'}</TableCell>
                    <TableCell>{student.nom} {student.postnom} {student.prenom}</TableCell>
                    <TableCell>{student.filiere}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={status === 'present' ? 'default' : 'outline'}
                          onClick={() => changeStatus(student.id, 'present')}
                        >
                          Présent
                        </Button>
                        <Button
                          size="sm"
                          variant={status === 'absent' ? 'destructive' : 'outline'}
                          onClick={() => changeStatus(student.id, 'absent')}
                        >
                          Absent
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="secondary" onClick={() => setQrStudent(student)}>
                        <QrCode className="h-4 w-4 mr-2" /> QR
                      </Button>
                      <Dialog open={!!qrStudent} onOpenChange={(open) => { if (!open) setQrStudent(null); }}>
                        <DialogContent className="max-w-sm">
                          <DialogHeader>
                            <DialogTitle>QRCode de {qrStudent?.nom}</DialogTitle>
                          </DialogHeader>
                          <div className="flex flex-col items-center gap-4 py-4">
                            <QRCodeSVG value={qrStudent ? buildQrCodeValue(qrStudent.id) : ''} size={180} />
                            <div className="text-xs text-muted-foreground break-all text-center">
                              {qrStudent ? buildQrCodeValue(qrStudent.id) : ''}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Sélectionnez un cours pour afficher les étudiants.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guide de présence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>✅ Utilisez les codes QR pour les séances pratiques et les laboratoires.</p>
          <p>✅ Enregistrez un code QR dans l’interface ou utilisez la validation manuelle.</p>
          <p>✅ Téléchargez la liste d’interrogation en CSV pour l’impression ou l’archivage.</p>
        </CardContent>
      </Card>
    </div>
  );
}
