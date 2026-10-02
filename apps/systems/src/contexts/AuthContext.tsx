import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserRole, Student } from '@/types';
import { authRequest } from '@/lib/authApi';

interface AuthUser {
  id: string;
  email: string;
  nom: string;
  role: UserRole;
  studentData?: Student;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<string | null>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const { user: currentUser } = await authRequest<{ user: AuthUser }>('/api/auth/session');
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    let active = true;
    authRequest<{ user: AuthUser }>('/api/auth/session')
      .then(({ user: currentUser }) => { if (active) setUser(currentUser); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<string | null> => {
    try {
      const result = await authRequest<{ user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });
      setUser(result.user);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'Identifiants incorrects.';
    }
  };

  const logout = async () => {
    try {
      await authRequest('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  };

  const resetPassword = async (email: string): Promise<string | null> => {
    try {
      await authRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'Erreur lors de la réinitialisation.';
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string): Promise<string | null> => {
    try {
      await authRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'Erreur lors du changement de mot de passe.';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshSession, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};
