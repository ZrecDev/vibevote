'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createSessionRequestSchema,
  decisionCategorySchema,
  decisionModeSchema,
} from '@vibevote/contracts';
import { AppShell } from '@/components/app-shell';
import { Button, Card, Input } from '@/components/ui';
import { createSession, SessionClientError } from '@/features/session/session-client';

const categories = decisionCategorySchema.options;
const modes = decisionModeSchema.options;
export default function CreatePage() {
  const router = useRouter();
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [form, setForm] = useState({
    hostDisplayName: '',
    title: '',
    category: categories[0],
    mode: modes[0],
    options: ['', ''],
  });
  const [error, setError] = useState('');
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const update = (key: 'hostDisplayName' | 'title', value: string) =>
    setForm((f) => ({ ...f, [key]: value }));
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    const parsed = createSessionRequestSchema.safeParse({
      ...form,
      options: form.options.map((label) => ({ label })),
    });
    if (!parsed.success) {
      const fields = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))];
      setInvalidFields(fields);
      setError('Please complete your name, decision, and at least two valid options.');
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    setError('');
    setInvalidFields([]);
    setPending(true);
    try {
      const result = await createSession(parsed.data);
      router.push(`/room/${result.session.session.id}`);
    } catch (reason) {
      setError(
        reason instanceof SessionClientError
          ? reason.message
          : 'Something went wrong. Please try again.',
      );
      setPending(false);
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  }
  return (
    <AppShell>
      <section className="page-intro">
        <p className="eyebrow">New decision</p>
        <h1 className="room-title">Start with a good question.</h1>
        <p className="lede">Give the group a clear choice and invite them to decide together.</p>
      </section>
      <Card>
        <form className="stack" onSubmit={submit} aria-busy={pending}>
          <label className="form-label" htmlFor="host-name">
            Your name
            <Input
              id="host-name"
              value={form.hostDisplayName}
              onChange={(e) => update('hostDisplayName', e.target.value)}
              aria-invalid={invalidFields.includes('hostDisplayName')}
              aria-describedby={
                invalidFields.includes('hostDisplayName') ? 'create-error' : undefined
              }
            />
          </label>
          <label className="form-label" htmlFor="decision-title">
            What are you deciding?
            <Input
              id="decision-title"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              aria-invalid={invalidFields.includes('title')}
              aria-describedby={invalidFields.includes('title') ? 'create-error' : undefined}
            />
          </label>
          <label className="form-label">
            Category
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value as typeof f.category }))
              }
            >
              {categories.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="form-label">
            Decision mode
            <select
              value={form.mode}
              onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value as typeof f.mode }))}
            >
              {modes.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <div>
            <div className="section-heading">
              <div>
                <h2>Options to consider</h2>
                <p className="muted">Add between two and twelve options.</p>
              </div>
              <span className="status-pill">{form.options.length} options</span>
            </div>
            {form.options.map((option, index) => (
              <div className="row" key={index}>
                <Input
                  aria-label={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      options: f.options.map((item, i) => (i === index ? e.target.value : item)),
                    }))
                  }
                  aria-invalid={invalidFields.includes('options')}
                  aria-describedby={invalidFields.includes('options') ? 'create-error' : undefined}
                />
                {form.options.length > 2 && (
                  <Button
                    type="button"
                    variant="quiet"
                    onClick={() =>
                      setForm((f) => ({ ...f, options: f.options.filter((_, i) => i !== index) }))
                    }
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            {form.options.length < 12 && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setForm((f) => ({ ...f, options: [...f.options, ''] }))}
              >
                Add option
              </Button>
            )}
          </div>
          {error && (
            <p id="create-error" ref={errorRef} tabIndex={-1} role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? 'Creating…' : 'Create room'}
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}
