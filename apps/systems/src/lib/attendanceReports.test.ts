import { describe, expect, it } from 'vitest';
import { buildAttendanceReport } from './attendanceReports';

describe('buildAttendanceReport', () => {
  it('calculates daily presence summary and course totals', () => {
    const rows = [
      { student_id: 's1', course_id: 'c1', session_type: 'cours', session_date: '2026-10-02', status: 'present' },
      { student_id: 's2', course_id: 'c1', session_type: 'cours', session_date: '2026-10-02', status: 'absent' },
      { student_id: 's3', course_id: 'c2', session_type: 'tp', session_date: '2026-10-02', status: 'present' },
      { student_id: 's4', course_id: 'c2', session_type: 'tp', session_date: '2026-10-03', status: 'present' },
    ];

    const report = buildAttendanceReport(rows, {
      reportType: 'daily',
      anchorDate: new Date('2026-10-02'),
      courses: [
        { id: 'c1', nom: 'Mathématiques' },
        { id: 'c2', nom: 'Physique' },
      ],
    });

    expect(report.summary.total).toBe(3);
    expect(report.summary.present).toBe(2);
    expect(report.summary.absent).toBe(1);
    expect(report.summary.rate).toBe(67);
    expect(report.courseBreakdown.some((item) => item.courseName === 'Mathématiques' && item.present === 1 && item.absent === 1)).toBe(true);
  });

  it('groups by course for the course report', () => {
    const rows = [
      { student_id: 's1', course_id: 'c1', session_type: 'cours', session_date: '2026-10-02', status: 'present' },
      { student_id: 's2', course_id: 'c1', session_type: 'cours', session_date: '2026-10-02', status: 'present' },
      { student_id: 's3', course_id: 'c2', session_type: 'tp', session_date: '2026-10-02', status: 'absent' },
    ];

    const report = buildAttendanceReport(rows, {
      reportType: 'course',
      anchorDate: new Date('2026-10-02'),
      courses: [
        { id: 'c1', nom: 'Mathématiques' },
        { id: 'c2', nom: 'Physique' },
      ],
    });

    expect(report.courseBreakdown.find((item) => item.courseId === 'c1')?.present).toBe(2);
    expect(report.courseBreakdown.find((item) => item.courseId === 'c2')?.absent).toBe(1);
  });
});
