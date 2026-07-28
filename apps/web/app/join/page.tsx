'use client';

import { useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { joinSessionRequestSchema } from '@vibevote/contracts';
import { AppShell } from '@/components/app-shell';
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
            ? 'VibeVote cannot reach the room service right now. Please try again shortly.'
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
          <h1 className="page-title">Join room</h1>
          <p className="lede">Enter the name your group knows.</p>
        </section>
        <Card className="join-card">
          <div className="join-card__heading">
            <span className={`invite-indicator ${token ? 'invite-indicator--valid' : ''}`}>
              <span aria-hidden="true" />
              {token ? 'Valid invitation' : 'Invitation needed'}
            </span>
            <h2>Your name</h2>
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
                Visible to this room only.
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
                'Join room'
              )}
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
