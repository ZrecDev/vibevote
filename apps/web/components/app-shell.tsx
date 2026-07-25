import Link from 'next/link';

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="app-shell">
      <header className="app-header">
        <Link className="wordmark" href="/">
          VibeVote <span>decide kindly</span>
        </Link>
        <nav aria-label="Primary">
          <Link className="header-link" href="/create">
            New room
          </Link>
        </nav>
      </header>
      {children}
    </main>
  );
}
