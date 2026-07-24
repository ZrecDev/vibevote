import type { ButtonHTMLAttributes, InputHTMLAttributes } from 'react';
export function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`min-h-11 rounded-xl bg-[var(--accent)] px-4 py-2 font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="min-h-11 w-full rounded-xl border border-[var(--line)] bg-transparent px-3"
      {...props}
    />
  );
}
export function Card({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
      {children}
    </section>
  );
}
export function DialogPlaceholder({
  title,
  children,
}: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="rounded-2xl border border-[var(--line)] p-5"
    >
      {children}
    </div>
  );
}
