import type { ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

export function Button({
  className = '',
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
}) {
  return <button className={`button button--${variant} ${className}`.trim()} {...props} />;
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`input ${className}`.trim()} {...props} />;
}

export function Card({
  children,
  className = '',
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return <section className={`card ${className}`.trim()}>{children}</section>;
}

export function DialogPlaceholder({
  title,
  children,
}: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="card">
      {children}
    </div>
  );
}
