import clsx from 'clsx';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/dads/Button/Button';
import { AccessibilityPanel } from '@/components/ui/AccessibilityPanel';
import { Furigana } from '@/components/ui/Furigana';

type NavItem = { to: string; label: string; end: boolean };

const BASE_LINKS: NavItem[] = [
  { to: '/', label: 'ホーム', end: true },
  { to: '/mail-sends/by-office', label: '送付先別一覧', end: false },
  { to: '/mail-sends/history', label: '送付履歴', end: false },
  { to: '/users', label: '利用者管理', end: false },
  { to: '/offices', label: '事業所管理', end: false },
];

const ADMIN_LINKS: NavItem[] = [
  { to: '/staffs', label: 'スタッフ管理', end: false },
];

export const Header = () => {
  const { currentStaff, isAdmin, logout } = useAuth();
  const links = isAdmin ? [...BASE_LINKS, ...ADMIN_LINKS] : BASE_LINKS;
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      <AccessibilityPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-white focus:text-green-700 focus:rounded focus:outline-2 focus:outline-yellow-400"
      >
        本文へスキップ
      </a>
      <header className="bg-green-700 shrink-0" role="banner">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between px-6 h-14">
          <span className="text-std-17B-170 text-white select-none">郵便物送付管理</span>
          <div className="flex items-center gap-4">
            {currentStaff && (
              <span className="text-std-14N-130 text-white opacity-90">
                {currentStaff.name}
              </span>
            )}
            <button
              onClick={() => setIsPanelOpen(true)}
              aria-label="つかいやすさの設定をひらく"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white hover:bg-opacity-20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Settings size={22} />
            </button>
            <Button variant="outline" size="xs" onClick={logout}>
              ログアウト
            </Button>
          </div>
        </div>
        <nav aria-label="グローバルナビゲーション" className="bg-solid-gray-50 border-b border-solid-gray-200">
          <ul className="max-w-5xl mx-auto w-full flex gap-2 px-4 py-2 overflow-x-auto" role="list">
            {links.map(({ to, label, end }) => (
              <li key={to} role="none">
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    clsx(
                      'block px-4 py-2 text-std-14N-130 whitespace-nowrap rounded-8 border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400',
                      isActive
                        ? 'bg-green-700 border-green-700 text-white font-bold shadow-sm'
                        : 'bg-white border-solid-gray-200 text-solid-gray-700 hover:bg-green-50 hover:border-green-300 hover:text-green-700'
                    )
                  }
                  aria-current={undefined}
                >
                  <Furigana text={label} />
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
    </>
  );
};
