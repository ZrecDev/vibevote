import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { ArrowIcon, CheckIcon, LockIcon, SparkIcon, UsersIcon, VoteIcon } from '@/components/icons';

export default function HomePage() {
  return (
    <AppShell>
      <section className="home-hero">
        <div className="home-hero__copy">
          <div className="hero-badge">
            <SparkIcon width="16" height="16" />
            Group decisions, without the group chat spiral
          </div>
          <h1>Find the choice everyone can feel good about.</h1>
          <p className="lede">
            Create a private room, invite your people, and turn everyone&apos;s honest preferences
            into one clear decision.
          </p>
          <div className="hero-actions">
            <Link className="button button--primary button--large" href="/create">
              Start a decision
              <ArrowIcon width="18" height="18" />
            </Link>
            <Link className="button button--secondary button--large" href="/join">
              Join a room
            </Link>
          </div>
          <div className="trust-row" aria-label="VibeVote benefits">
            <span>
              <CheckIcon width="16" height="16" /> No account needed
            </span>
            <span>
              <LockIcon width="16" height="16" /> Votes stay private
            </span>
          </div>
        </div>
        <div className="decision-preview" aria-label="Example decision room">
          <div className="preview-glow" aria-hidden="true" />
          <div className="preview-window">
            <div className="preview-window__top">
              <span className="preview-brand-dot" />
              <span>Friday night</span>
              <span className="preview-live">Live</span>
            </div>
            <div className="preview-question">
              <span className="preview-kicker">Tonight&apos;s decision</span>
              <strong>Where should we eat?</strong>
              <span>4 friends · 3 options</span>
            </div>
            <div className="preview-options">
              <div>
                <span>01</span>
                <strong>Juniper Table</strong>
                <span className="preview-choice">Love</span>
              </div>
              <div>
                <span>02</span>
                <strong>Green House</strong>
                <span>Fine</span>
              </div>
              <div>
                <span>03</span>
                <strong>Little Napoli</strong>
                <span>Pass</span>
              </div>
            </div>
            <div className="preview-private">
              <LockIcon width="16" height="16" />
              Your ballot is visible only to you
            </div>
          </div>
        </div>
      </section>

      <section className="how-section" aria-labelledby="how-it-works">
        <div className="section-copy">
          <p className="eyebrow">One calm flow</p>
          <h2 id="how-it-works">From “what should we do?” to done.</h2>
          <p className="muted">A focused room gives every person equal input—without the noise.</p>
        </div>
        <div className="step-grid">
          <article className="feature-card">
            <span className="feature-icon">
              <SparkIcon />
            </span>
            <span className="step-number">01</span>
            <h3>Set the choice</h3>
            <p>Add the real options and choose how the group should decide.</p>
          </article>
          <article className="feature-card">
            <span className="feature-icon">
              <UsersIcon />
            </span>
            <span className="step-number">02</span>
            <h3>Bring everyone in</h3>
            <p>Share one secure link. No signup, download, or public profile.</p>
          </article>
          <article className="feature-card">
            <span className="feature-icon">
              <VoteIcon />
            </span>
            <span className="step-number">03</span>
            <h3>Vote honestly</h3>
            <p>Private ballots turn individual preferences into a fair result.</p>
          </article>
        </div>
      </section>

      <section className="closing-card">
        <div>
          <p className="eyebrow">Ready when you are</p>
          <h2>Make the next plan the easy one.</h2>
        </div>
        <Link className="button button--primary button--large" href="/create">
          Create your room
          <ArrowIcon width="18" height="18" />
        </Link>
      </section>
    </AppShell>
  );
}
