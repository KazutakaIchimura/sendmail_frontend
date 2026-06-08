import clsx from 'clsx';
import { Navigate, Outlet } from 'react-router-dom';
import { Header } from './Header';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AccessibilityProvider, useAccessibility } from '@/contexts/AccessibilityContext';

const AppLayoutContent = () => {
  const { currentStaff, isLoading } = useAuth();
  const { settings } = useAccessibility();
  const bgClass = settings.bgColor === 'white' ? 'bg-solid-gray-50' : `bg-theme-${settings.bgColor}`;

  if (isLoading) return null;
  if (!currentStaff) return <Navigate to="/login" replace />;

  return (
    <div className={clsx('flex flex-col min-h-screen', bgClass)}>
      <Header />
      <main id="main-content" className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};

export const AppLayout = () => (
  <AccessibilityProvider>
    <AuthProvider>
      <AppLayoutContent />
    </AuthProvider>
  </AccessibilityProvider>
);
