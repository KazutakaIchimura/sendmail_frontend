import clsx from 'clsx';
import { Navigate, Outlet } from 'react-router-dom';
import { Header } from './Header';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AccessibilityProvider, useAccessibility } from '@/contexts/AccessibilityContext';
import { SessionTimeoutModal } from '@/components/ui/SessionTimeoutModal';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';

const AppLayoutContent = () => {
  const { currentStaff, isLoading } = useAuth();
  const { settings } = useAccessibility();
  const bgClass = settings.bgColor === 'white' ? 'bg-solid-gray-50' : `bg-theme-${settings.bgColor}`;
  const { showWarning, remainingMs, extend } = useSessionTimeout();

  if (isLoading) return null;
  if (!currentStaff) return <Navigate to="/login" replace />;

  return (
    <div className={clsx('flex flex-col min-h-screen', bgClass)}>
      <Header />
      <main id="main-content" className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <Outlet />
      </main>
      <SessionTimeoutModal isOpen={showWarning} remainingMs={remainingMs} onExtend={extend} />
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
