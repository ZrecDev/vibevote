import { Card } from './ui';
export function StateMessage({
  title,
  children,
  tone = 'neutral',
}: Readonly<{ title: string; children: React.ReactNode; tone?: 'neutral' | 'error' }>) {
  return (
    <Card className="state-panel">
      <div>
        <div className="state-icon" aria-hidden="true">
          {tone === 'error' ? '!' : '·'}
        </div>
        <p className="eyebrow">VibeVote</p>
        <h1 className={`state-title ${tone === 'error' ? 'text-[var(--danger)]' : ''}`}>{title}</h1>
        <p className="muted">{children}</p>
      </div>
    </Card>
  );
}
