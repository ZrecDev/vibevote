import Link from 'next/link';
import { BrandMark, PlusIcon } from './icons';

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <main className="app-shell">
        <header className="app-header">
          <Link className="wordmark" href="/" aria-label="VibeVote home">
            <span className="brand-icon">
              <BrandMark width="24" height="24" />
            </span>
            <span>
              VibeVote
              <small>decide together</small>
            </span>
          </Link>
          <nav aria-label="Primary">
            <Link className="header-link" href="/create">
              <PlusIcon width="17" height="17" />
              <span>New room</span>
            </Link>
          </nav>
        </header>
        <div className="page-transition" id="main-content">
          {children}
        </div>
        <footer className="app-footer">
          <span>Private by design.</span>
          <span>Made for real decisions.</span>
        </footer>
      </main>
    </>
  );
}
