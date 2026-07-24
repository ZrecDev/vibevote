import { Card } from './ui';
export function StateMessage({
  title,
  children,
  tone = 'neutral',
}: Readonly<{ title: string; children: React.ReactNode; tone?: 'neutral' | 'error' }>) {
  return (
    <Card>
      <h2 className={tone === 'error' ? 'text-[var(--danger)]' : ''}>{title}</h2>
      <p className="mb-0 text-[var(--muted)]">{children}</p>
    </Card>
  );
}
