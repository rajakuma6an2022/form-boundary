import type { ReactNode } from 'react';
import { Logo } from '../../components/layout/Logo';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          <h1 className="text-xl font-semibold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-6 text-center text-sm text-ink-muted">{footer}</p>
      </div>
    </main>
  );
}