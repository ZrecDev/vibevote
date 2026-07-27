import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui';

export default function OfflinePage() {
  return (
    <AppShell>
      <Card className="state-panel">
        <div>
          <div className="state-icon" aria-hidden="true">
            ↻
          </div>
          <p className="eyebrow">You are offline</p>
          <h1 className="room-title">Your room is safe.</h1>
          <p className="muted">
            Reconnect to refresh the current room. We do not store private ballots or room
            credentials on this device.
          </p>
          <Link className="button button--primary" href="/">
            Try again
          </Link>
        </div>
      </Card>
    </AppShell>
  );
}
