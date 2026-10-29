import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'border border-line bg-surface text-ink hover:bg-canvas',
  danger: 'border border-line bg-surface text-danger hover:bg-danger-soft',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'primary', type = 'button', className = '', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-control px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}