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
          ? reason.message
          : 'Something went wrong. Please try again.',
      );
      setPending(false);
      submittingRef.current = false;
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  }
  return (
    <AppShell>
      <section className="page-intro">
        <p className="eyebrow">Join a room</p>
        <h1 className="room-title">Add your voice.</h1>
        <p className="lede">Enter your name to join this decision.</p>
      </section>
      <Card>
        <form className="stack" onSubmit={submit} aria-busy={pending}>
          <label className="form-label" htmlFor="join-name">
            Your name
            <Input
              id="join-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              aria-invalid={invalid}
              aria-describedby={error ? 'join-error' : undefined}
            />
          </label>
          {error && (
            <p id="join-error" ref={errorRef} tabIndex={-1} role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? 'Joining…' : 'Join room'}
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}
