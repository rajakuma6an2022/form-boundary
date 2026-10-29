import { FileText, Inbox, LayoutDashboard, LogOut, Settings } from 'lucide-react';
import { NavLink } from 'react-router';
import { logout } from '../../api/auth';
import { useAppSelector } from '../../store/hooks';
import { Logo } from './Logo';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/forms', label: 'Forms', Icon: FileText },
  { to: '/responses', label: 'Responses', Icon: Inbox },
  { to: '/settings', label: 'Settings', Icon: Settings },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function Sidebar() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <aside className="sticky top-0 flex h-screen w-[260px] shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>

      <nav aria-label="Main" className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `relative flex h-10 items-center gap-3 rounded-control px-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-soft text-primary before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r-full before:bg-primary'
                      : 'text-ink-muted hover:bg-canvas hover:text-ink'
                  }`
                }
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-line p-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary-hover"
          >
            {initials(user?.name ?? '')}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
            <p className="truncate text-xs text-ink-muted">{user?.email}</p>
          </div>
          <button
            type="button"
            aria-label="Log out"
            onClick={() => {
              void logout();
            }}
            className="grid size-9 shrink-0 place-items-center rounded-control text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </aside>
  );
}