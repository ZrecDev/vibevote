'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createSessionRequestSchema,
  decisionCategorySchema,
  decisionModeSchema,
} from '@vibevote/contracts';
import { AppShell } from '@/components/app-shell';
import { PlusIcon, TrashIcon } from '@/components/icons';
import { Button, Card, Input } from '@/components/ui';
import { createSession, SessionClientError } from '@/features/session/session-client';

const categories = decisionCategorySchema.options;
const modes = decisionModeSchema.options;
const categoryLabels = {
  EAT: 'Food & drink',
  DO: 'Things to do',
  WATCH: 'Something to watch',
  CUSTOM: 'Something else',
} as const;
const modeLabels = {
  INSTANT_MATCH: 'Instant Match',
  BEST_FIT: 'Best Fit',
  CHAOS: 'Chaos Pick',
} as const;
const modeDescriptions = {
  INSTANT_MATCH: 'Everyone must accept the winner.',
  BEST_FIT: 'Balances the group’s preferences.',
  CHAOS: 'Picks fairly from accepted options.',
} as const;

export default function CreatePage() {
  const router = useRouter();
  const errorRef = useRef<HTMLParagraphElement>(null);
  const submittingRef = useRef(false);
  const [form, setForm] = useState({
    hostDisplayName: '',
    title: '',
    category: categories[0]!,
    mode: modes[0]!,
    options: ['', ''],
  });
  const [error, setError] = useState('');
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const update = (key: 'hostDisplayName' | 'title', value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending || submittingRef.current) return;
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
    submittingRef.current = true;
    setPending(true);
    try {
      const result = await createSession(parsed.data);
      router.push(`/room/${result.session.session.id}`);
    } catch (reason) {
      setError(
        reason instanceof SessionClientError
          ? reason.status === 503
            ? 'VibeVote cannot reach the room service right now. Your setup is still here—wait a moment and try again.'
            : reason.message
          : 'Something went wrong. Your setup is still here—please try again.',
      );
      setPending(false);
      submittingRef.current = false;
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  }

  return (
    <AppShell>
      <section className="page-intro page-intro--compact">
        <h1 className="page-title">New decision</h1>
        <p className="lede">Add a question and a few options.</p>
      </section>

      <div className="create-layout">
        <Card className="form-card">
          <form className="stack form-stack" onSubmit={submit} aria-busy={pending} noValidate>
            <div className="form-section">
              <div className="form-section__heading">
                <h2>Details</h2>
              </div>
              <div className="form-grid">
                <label className="form-label" htmlFor="host-name">
                  <span>Your name</span>
                  <Input
                    id="host-name"
                    autoComplete="name"
                    placeholder="e.g. Alex"
                    value={form.hostDisplayName}
                    onChange={(event) => update('hostDisplayName', event.target.value)}
                    aria-invalid={invalidFields.includes('hostDisplayName')}
                    aria-describedby={
                      invalidFields.includes('hostDisplayName') ? 'create-error' : undefined
                    }
                  />
                </label>
                <label className="form-label form-label--wide" htmlFor="decision-title">
                  <span>What are you deciding?</span>
                  <Input
                    id="decision-title"
                    placeholder="e.g. Where should we go for dinner?"
                    value={form.title}
                    onChange={(event) => update('title', event.target.value)}
                    aria-invalid={invalidFields.includes('title')}
                    aria-describedby={invalidFields.includes('title') ? 'create-error' : undefined}
                  />
                </label>
                <label className="form-label" htmlFor="decision-category">
                  <span>Category</span>
                  <select
                    className="select"
                    id="decision-category"
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        category: event.target.value as typeof current.category,
                      }))
                    }
                  >
                    {categories.map((value) => (
                      <option key={value} value={value}>
                        {categoryLabels[value]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-label" htmlFor="decision-mode">
                  <span>Decision mode</span>
                  <select
                    className="select"
                    id="decision-mode"
                    aria-label="Decision mode"
                    value={form.mode}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        mode: event.target.value as typeof current.mode,
                      }))
                    }
                  >
                    {modes.map((value) => (
                      <option key={value} value={value}>
                        {modeLabels[value]}
                      </option>
                    ))}
                  </select>
                  <small className="field-help">{modeDescriptions[form.mode]}</small>
                </label>
              </div>
            </div>

            <fieldset className="form-section option-fieldset">
              <legend className="sr-only">Options to consider</legend>
              <div className="form-section__heading form-section__heading--split">
                <h2>Options</h2>
                <span className="count-pill">{form.options.length} / 12</span>
              </div>
              <div className="option-editor-list">
                {form.options.map((option, index) => (
                  <div className="option-editor" key={index}>
                    <span className="option-index" aria-hidden="true">
                      {index + 1}
                    </span>
                    <label className="sr-only" htmlFor={`option-${index}`}>
                      Option {index + 1}
                    </label>
                    <Input
                      id={`option-${index}`}
                      aria-label={`Option ${index + 1}`}
                      placeholder={index < 2 ? `Option ${index + 1}` : 'Another option'}
                      value={option}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          options: current.options.map((item, optionIndex) =>
                            optionIndex === index ? event.target.value : item,
                          ),
                        }))
                      }
                      aria-invalid={invalidFields.includes('options')}
                      aria-describedby={
                        invalidFields.includes('options') ? 'create-error' : undefined
                      }
                    />
                    {form.options.length > 2 && (
                      <Button
                        className="icon-button"
                        type="button"
                        variant="quiet"
                        aria-label={`Remove option ${index + 1}`}
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            options: current.options.filter(
                              (_, optionIndex) => optionIndex !== index,
                            ),
                          }))
                        }
                      >
                        <TrashIcon width="18" height="18" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {form.options.length < 12 && (
                <Button
                  className="add-option-button"
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setForm((current) => ({ ...current, options: [...current.options, ''] }))
                  }
                >
                  <PlusIcon width="18" height="18" />
                  Add option
                </Button>
              )}
            </fieldset>

            {error && (
              <p
                className="alert alert--error"
                id="create-error"
                ref={errorRef}
                tabIndex={-1}
                role="alert"
              >
                {error}
              </p>
            )}
            <div className="form-submit">
              <div className="submit-note">Private room</div>
              <Button className="button--large" type="submit" disabled={pending}>
                {pending ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    Creating room…
                  </>
                ) : (
                  'Create room'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
