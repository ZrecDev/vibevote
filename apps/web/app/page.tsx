import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Button, Card } from '@/components/ui';
export default function HomePage() {
  return (
    <AppShell>
      <section className="space-y-6 py-8">
        <p className="text-sm font-semibold uppercase tracking-[.18em] text-[var(--accent)]">
          Private group decisions
        </p>
        <h1 className="max-w-xl text-5xl font-bold tracking-tight sm:text-6xl">
          Stop debating.
          <br />
          Decide together.
        </h1>
        <p className="max-w-lg text-lg text-[var(--muted)]">
          Create one room, invite your people, and reach a fair decision everyone can live with.
        </p>
        <Link href="/create">
          <Button>Start a decision</Button>
        </Link>
      </section>
      <Card>
        <h2 className="text-xl font-semibold">Foundation status</h2>
        <p className="text-[var(--muted)]">
          The app shell is ready. Sessions, votes, accounts, and realtime are intentionally not
          implemented yet.
        </p>
      </Card>
    </AppShell>
  );
}
