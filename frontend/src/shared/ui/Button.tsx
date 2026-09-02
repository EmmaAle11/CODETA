import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'peligro' };

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  return <button className={`gt-btn gt-btn--${variant} ${className}`.trim()} {...props} />;
}
