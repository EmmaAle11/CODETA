import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

function Envoltura({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="gt-field">
      <span className="gt-field__label">{label}</span>
      {children}
      {hint && <span className="gt-field__hint">{hint}</span>}
    </label>
  );
}

export function Input({ label, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <Envoltura label={label} hint={hint}>
      <input className="gt-input" {...props} />
    </Envoltura>
  );
}

export function Select({ label, hint, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string }) {
  return (
    <Envoltura label={label} hint={hint}>
      <select className="gt-input" {...props}>{children}</select>
    </Envoltura>
  );
}
