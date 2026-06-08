import { createContext, useContext, useEffect, useState } from 'react';
import type { Staff } from '@/types/staff';
import { client } from '@/api/client';

type AuthContextType = {
  currentStaff: Staff | null;
  isLoading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const r = await client.get<Staff>('/auth/me');
      setCurrentStaff(r.data);
    } catch {
      setCurrentStaff(null);
    } finally {
      setIsLoading(false);
    }
  };

  // NOTE: 認証不要ルートでは AuthProvider が存在しないため useEffect で初回取得する
  useEffect(() => {
    fetchMe();
  }, []);

  const logout = async () => {
    try {
      await client.post('/auth/logout');
    } catch {
      // logout API が失敗してもセッションをクリアしてリダイレクト
    }
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ currentStaff, isLoading, isAdmin: currentStaff?.role === 'ADMIN', logout, refresh: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
