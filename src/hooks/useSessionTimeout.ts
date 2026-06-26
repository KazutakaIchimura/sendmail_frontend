import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe } from '@/api/auth';

const WARN_MS = 25 * 60 * 1000;
const EXPIRE_MS = 30 * 60 * 1000;

export const useSessionTimeout = () => {
  const lastActivityRef = useRef(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [remainingMs, setRemainingMs] = useState(EXPIRE_MS);
  const navigate = useNavigate();

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const extend = useCallback(async () => {
    await getMe();
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart'] as const;
    events.forEach(e => window.addEventListener(e, resetActivity, { passive: true }));
    return () => events.forEach(e => window.removeEventListener(e, resetActivity));
  }, [resetActivity]);

  useEffect(() => {
    const interval = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current;
      const remaining = EXPIRE_MS - idle;
      if (remaining <= 0) {
        navigate('/login', { replace: true });
        return;
      }
      setShowWarning(idle >= WARN_MS);
      setRemainingMs(Math.max(0, remaining));
    }, 1000);
    return () => clearInterval(interval);
  }, [navigate]);

  return { showWarning, remainingMs, extend };
};
