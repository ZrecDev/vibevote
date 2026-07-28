import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { CheckIcon, LockIcon } from '@/components/icons';

export default function HomePage() {
  return (
    <AppShell>
      <section className="home-hero">
        <div className="home-hero__copy">
          <p className="eyebrow">Private group decisions</p>
          <h1>Decide together.</h1>
          <p className="lede">Create a room, invite your group, and vote privately.</p>
          <div className="hero-actions">
            <Link className="button button--primary button--large" href="/create">
              Create room
            </Link>
            <Link className="button button--secondary button--large" href="/join">
              Join room
            </Link>
          </div>
          <div className="trust-row" aria-label="VibeVote benefits">
            <span>
              <CheckIcon width="15" height="15" /> No accounts
            </span>
            <span>
              <LockIcon width="15" height="15" /> Private ballots
            </span>
          </div>
        </div>

        <div className="decision-preview" aria-label="Example decision room">
          <div className="preview-window">
            <div className="preview-window__top">
              <span>Friday dinner</span>
              <span className="preview-live">4 people</span>
            </div>
            <div className="preview-question">
              <strong>Where should we eat?</strong>
            </div>
            <div className="preview-options">
              {['Mora', 'Little Fox', 'Bar Verde'].map((option) => (
                <div key={option}>
                  <span className="preview-radio" aria-hidden="true" />
                  <strong>{option}</strong>
                </div>
              ))}
            </div>
            <div className="preview-private">
              <LockIcon width="16" height="16" />
              Your vote stays private
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
