import { Outlet } from 'react-router';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function AppShell() {
  return (
    <div className="flex min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:shadow-menu"
      >
        Skip to main content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main id="main" tabIndex={-1} className="flex-1 px-8 py-6 focus:outline-none">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}