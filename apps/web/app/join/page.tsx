'use client';

import { useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { joinSessionRequestSchema } from '@vibevote/contracts';
import { AppShell } from '@/components/app-shell';
import { ArrowIcon, LockIcon, UsersIcon } from '@/components/icons';
import { Button, Card, Input } from '@/components/ui';
import { joinSession, SessionClientError } from '@/features/session/session-client';

export default function JoinPage() {
  const router = useRouter();
  const token = useSearchParams().get('invite') ?? '';
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [pending, setPending] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const submittingRef = useRef(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending || submittingRef.current) return;
    const parsed = joinSessionRequestSchema.safeParse({ inviteToken: token, displayName });
    if (!parsed.success) {
      setInvalid(true);
      setError(
        token ? 'Enter a valid name to join this room.' : 'This invitation is missing or invalid.',
      );
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    setError('');
    setInvalid(false);
    submittingRef.current = true;
    setPending(true);
    try {
      const result = await joinSession(parsed.data);
      router.push(`/room/${result.session.session.id}`);
    } catch (reason) {
      setError(
        reason instanceof SessionClientError
          ? reason.status === 503
            ? 'VibeVote cannot reach the room service right now. Your invitation is safe—please try again shortly.'
            : reason.message
          : 'Something went wrong. Please check the invitation and try again.',
      );
      setPending(false);
      submittingRef.current = false;
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  }

  return (
    <AppShell>
      <div className="join-layout">
        <section className="join-copy">
          <div className="hero-badge">
            <UsersIcon width="16" height="16" />
            Private decision room
          </div>
          <h1 className="page-title">Your voice belongs in the room.</h1>
          <p className="lede">
            Join with the name your group knows. No account, profile, or public activity.
          </p>
          <div className="join-assurance">
            <LockIcon width="18" height="18" />
            <span>
              <strong>Your votes stay private.</strong>
              Only shared readiness and the final choice appear to the group.
            </span>
          </div>
        </section>
        <Card className="join-card">
          <div className="join-card__heading">
            <span className={`invite-indicator ${token ? 'invite-indicator--valid' : ''}`}>
              <span aria-hidden="true" />
              {token ? 'Invitation ready' : 'Invitation needed'}
            </span>
            <h2>How should we call you?</h2>
            <p className="muted">This name appears only inside this room.</p>
          </div>
          <form className="stack form-stack" onSubmit={submit} aria-busy={pending} noValidate>
            <label className="form-label" htmlFor="join-name">
              <span>Your name</span>
              <Input
                id="join-name"
                aria-label="Your name"
                autoComplete="name"
                autoFocus
                placeholder="e.g. Sam"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                aria-invalid={invalid}
                aria-describedby={error ? 'join-error' : 'join-name-help'}
              />
              <small className="field-help" id="join-name-help">
                No email or password required.
              </small>
            </label>
            {error && (
              <p
                className="alert alert--error"
                id="join-error"
                ref={errorRef}
                tabIndex={-1}
                role="alert"
              >
                {error}
              </p>
            )}
            <Button className="button--large button--full" type="submit" disabled={pending}>
              {pending ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Joining room…
                </>
              ) : (
                <>
                  Join room
                  <ArrowIcon width="18" height="18" />
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
