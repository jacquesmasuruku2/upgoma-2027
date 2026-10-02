import { addDays, endOfDay, endOfMonth, endOfQuarter, format, isWithinInterval, startOfDay, startOfMonth, startOfQuarter } from 'date-fns';

export type AttendanceReportType = 'daily' | '3days' | 'weekly' | 'monthly' | 'quarterly' | 'course';

export interface AttendanceRecordLike {
  id?: string;
  student_id: string;
  course_id: string;
  session_type: string;
  session_date: string;
  status: 'present' | 'absent';
}

export interface AttendanceReportSummary {
  total: number;
  present: number;
  absent: number;
  rate: number;
}

export interface CourseLike {
  id: string;
  nom: string;
  code?: string;
}

export interface AttendancePeriodRow {
  label: string;
  start: string;
  end: string;
  present: number;
  absent: number;
  total: number;
  rate: number;
}

export interface AttendanceCourseBreakdown {
  courseId: string;
  courseName: string;
  present: number;
  absent: number;
  total: number;
  rate: number;
}

export interface BuildAttendanceReportParams {
  reportType: AttendanceReportType;
  anchorDate: Date;
  courseId?: string;
  courses: CourseLike[];
}

export interface AttendanceReportResult {
  summary: AttendanceReportSummary;
  periods: AttendancePeriodRow[];
  courseBreakdown: AttendanceCourseBreakdown[];
  rangeLabel: string;
}

const courseNameMap = (courses: CourseLike[]) =>
  new Map(courses.map((course) => [course.id, course.nom || course.code || 'Cours']))

const clampDate = (date: string) => new Date(`${date}T00:00:00`);

const getDateWindow = (reportType: AttendanceReportType, anchorDate: Date) => {
  const base = startOfDay(anchorDate);

  switch (reportType) {
    case 'daily':
      return { start: base, end: endOfDay(base), label: 'Journalier' };
    case '3days': {
      const start = addDays(base, -2);
      return { start: startOfDay(start), end: endOfDay(base), label: '3 jours' };
    }
    case 'weekly': {
      const start = addDays(base, -6);
      return { start: startOfDay(start), end: endOfDay(base), label: 'Hebdomadaire' };
    }
    case 'monthly': {
      const start = startOfMonth(base);
      return { start: startOfDay(start), end: endOfMonth(base), label: 'Mensuel' };
    }
    case 'quarterly': {
      const start = startOfQuarter(base);
      return { start: startOfDay(start), end: endOfQuarter(base), label: 'Trimestre' };
    }
    case 'course':
      return { start: startOfMonth(base), end: endOfMonth(base), label: 'Par cours' };
    default:
      return { start: base, end: endOfDay(base), label: 'Journalier' };
  }
};

const buildPeriodRows = (
  rows: AttendanceRecordLike[],
  start: Date,
  end: Date,
  reportType: AttendanceReportType,
  courseId?: string
) => {
  const dates: Date[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  if (reportType === 'course' || reportType === 'quarterly') {
    return dates.map((day) => {
      const dayRows = rows.filter((row) => {
        const rowDate = clampDate(row.session_date);
        return rowDate.getTime() === day.getTime() && (!courseId || row.course_id === courseId);
      });

      const present = dayRows.filter((row) => row.status === 'present').length;
      const absent = dayRows.filter((row) => row.status === 'absent').length;
      const total = present + absent;
      return {
        label: format(day, 'dd/MM'),
        start: format(day, 'yyyy-MM-dd'),
        end: format(day, 'yyyy-MM-dd'),
        present,
        absent,
        total,
        rate: total ? Math.round((present / total) * 100) : 0,
      };
    });
  }

  return dates.map((day) => {
    const dayRows = rows.filter((row) => {
      const rowDate = clampDate(row.session_date);
      return rowDate >= startOfDay(day) && rowDate <= endOfDay(day) && (!courseId || row.course_id === courseId);
    });

    const present = dayRows.filter((row) => row.status === 'present').length;
    const absent = dayRows.filter((row) => row.status === 'absent').length;
    const total = present + absent;
    return {
      label: format(day, 'dd/MM'),
      start: format(day, 'yyyy-MM-dd'),
      end: format(day, 'yyyy-MM-dd'),
      present,
      absent,
      total,
      rate: total ? Math.round((present / total) * 100) : 0,
    };
  });
};

export function buildAttendanceReport(
  rows: AttendanceRecordLike[],
  params: BuildAttendanceReportParams
): AttendanceReportResult {
  const { reportType, anchorDate, courseId, courses } = params;
  const window = getDateWindow(reportType, anchorDate);
  const start = new Date(window.start);
  const end = new Date(window.end);

  const filteredRows = rows.filter((row) => {
    const rowDate = clampDate(row.session_date);
    const matchesCourse = !courseId || row.course_id === courseId;
    return matchesCourse && isWithinInterval(rowDate, { start, end });
  });

  const summary: AttendanceReportSummary = {
    total: filteredRows.length,
    present: filteredRows.filter((row) => row.status === 'present').length,
    absent: filteredRows.filter((row) => row.status === 'absent').length,
    rate: filteredRows.length ? Math.round((filteredRows.filter((row) => row.status === 'present').length / filteredRows.length) * 100) : 0,
  };

  const periods = buildPeriodRows(filteredRows, start, end, reportType, courseId);

  const byCourse = new Map<string, AttendanceCourseBreakdown>();
  const names = courseNameMap(courses);

  filteredRows.forEach((row) => {
    const current = byCourse.get(row.course_id) || {
      courseId: row.course_id,
      courseName: names.get(row.course_id) || 'Cours',
      present: 0,
      absent: 0,
      total: 0,
      rate: 0,
    };

    if (row.status === 'present') current.present += 1;
    else current.absent += 1;
    current.total += 1;
    byCourse.set(row.course_id, current);
  });

  const courseBreakdown = Array.from(byCourse.values())
    .map((entry) => ({
      ...entry,
      rate: entry.total ? Math.round((entry.present / entry.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    summary,
    periods,
    courseBreakdown,
    rangeLabel: reportType === 'course' ? 'Par cours' : window.label,
  };
}
