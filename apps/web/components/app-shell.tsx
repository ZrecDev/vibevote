import Link from 'next/link';
export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 py-8">
      <header className="mb-12 flex items-center justify-between">
        <Link className="font-bold tracking-tight" href="/">
          VibeVote <span className="text-sm font-normal text-[var(--muted)]">codename</span>
        </Link>
        <nav aria-label="Primary">
          <Link className="rounded-md px-3 py-2 text-sm hover:bg-black/5" href="/create">
            Start a decision
          </Link>
        </nav>
      </header>
      {children}
    </main>
  );
}
