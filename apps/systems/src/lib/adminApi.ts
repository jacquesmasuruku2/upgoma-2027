const API_BASE = (import.meta.env.VITE_ADMIN_API_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');

export async function updateStudentStatus(studentId: string, status: 'approved' | 'rejected', matricule?: string) {
  const res = await fetch(`${API_BASE}/api/admin/students/${studentId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, matricule }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || 'Impossible de mettre à jour le statut étudiant.');
  }

  return payload;
}

export async function deleteStudent(studentId: string) {
  const res = await fetch(`${API_BASE}/api/admin/students/${studentId}`, {
    method: 'DELETE',
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || 'Impossible de supprimer l’étudiant.');
  }

  return payload;
}
