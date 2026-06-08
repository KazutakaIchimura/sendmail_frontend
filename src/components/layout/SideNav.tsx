import clsx from 'clsx';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type NavItem = { to: string; label: string; end: boolean };

const BASE_LINKS: NavItem[] = [
  { to: '/', label: 'ダッシュボード', end: true },
  { to: '/mail-sends/by-office', label: '📮 送付先別一覧', end: false },
  { to: '/mail-sends/history', label: '📋 送付履歴', end: false },
  { to: '/users', label: '👤 利用者管理', end: false },
  { to: '/offices', label: '🏢 事業所管理', end: false },
];

const ADMIN_LINKS: NavItem[] = [
  { to: '/staffs', label: '🔑 スタッフ管理', end: false },
];

export const SideNav = () => {
  const { isAdmin } = useAuth();
  const links = isAdmin ? [...BASE_LINKS, ...ADMIN_LINKS] : BASE_LINKS;

  return (
    <nav className="w-56 border-r border-solid-gray-200 bg-white min-h-full shrink-0 py-4">
      <ul className="space-y-0.5 px-2">
        {links.map(({ to, label, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'block px-3 py-2 rounded-8 text-std-14N-130 transition-colors',
                  isActive
                    ? 'bg-green-700 text-white font-bold'
                    : 'text-solid-gray-800 hover:bg-solid-gray-50'
                )
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
