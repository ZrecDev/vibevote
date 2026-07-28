import Link from 'next/link';
import { BrandMark } from './icons';

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
            <span>VibeVote</span>
          </Link>
          <nav aria-label="Primary">
            <Link className="header-link" href="/create">
              New room
            </Link>
          </nav>
        </header>
        <div className="page-transition" id="main-content">
          {children}
        </div>
      </main>
    </>
  );
}
