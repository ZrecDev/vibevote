'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createSessionRequestSchema,
  decisionCategorySchema,
  decisionModeSchema,
} from '@vibevote/contracts';
import { AppShell } from '@/components/app-shell';
import { CheckIcon, LockIcon, PlusIcon, SparkIcon, TrashIcon, UsersIcon } from '@/components/icons';
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
  INSTANT_MATCH: 'Choose only when everyone is genuinely on board.',
  BEST_FIT: 'Balance the whole group’s preferences for the strongest fit.',
  CHAOS: 'Pick fairly from the options the group is willing to accept.',
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
        <div className="hero-badge">
          <SparkIcon width="16" height="16" />
          New group decision
        </div>
        <h1 className="page-title">Set up the choice.</h1>
        <p className="lede">
          Start with a clear question and the real options. You can invite everyone next.
        </p>
      </section>

      <div className="create-layout">
        <Card className="form-card">
          <form className="stack form-stack" onSubmit={submit} aria-busy={pending} noValidate>
            <div className="form-section">
              <div className="form-section__heading">
                <span className="form-step">01</span>
                <div>
                  <h2>Decision details</h2>
                  <p>Give the room enough context to feel obvious.</p>
                </div>
              </div>
              <div className="form-grid">
                <label className="form-label" htmlFor="host-name">
                  <span>Your name</span>
                  <Input
                    id="host-name"
                    autoComplete="name"
                    placeholder="How the group will see you"
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
                  <span>How should the group decide?</span>
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
                <div className="form-heading-group">
                  <span className="form-step">02</span>
                  <div>
                    <h2>Options to consider</h2>
                    <p>Add between two and twelve clear choices.</p>
                  </div>
                </div>
                <span className="count-pill">{form.options.length} / 12</span>
              </div>
              <div className="option-editor-list">
                {form.options.map((option, index) => (
                  <div className="option-editor" key={index}>
                    <span className="option-index" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <label className="sr-only" htmlFor={`option-${index}`}>
                      Option {index + 1}
                    </label>
                    <Input
                      id={`option-${index}`}
                      aria-label={`Option ${index + 1}`}
                      placeholder={
                        index === 0
                          ? 'First choice'
                          : index === 1
                            ? 'Second choice'
                            : 'Another choice'
                      }
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
              <div className="submit-note">
                <LockIcon width="17" height="17" />
                Private room · no account required
              </div>
              <Button className="button--large" type="submit" disabled={pending}>
                {pending ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    Creating your room…
                  </>
                ) : (
                  <>
                    Create room
                    <CheckIcon width="19" height="19" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        <aside className="setup-aside" aria-label="What happens next">
          <p className="eyebrow">Then what?</p>
          <h2>You stay in control.</h2>
          <div className="aside-point">
            <span>
              <UsersIcon />
            </span>
            <div>
              <strong>Invite your group</strong>
              <p>Share one private link when the room is ready.</p>
            </div>
          </div>
          <div className="aside-point">
            <span>
              <CheckIcon />
            </span>
            <div>
              <strong>Check readiness</strong>
              <p>Voting starts only after everyone says they are ready.</p>
            </div>
          </div>
          <div className="aside-point">
            <span>
              <LockIcon />
            </span>
            <div>
              <strong>Keep votes private</strong>
              <p>Individual ballots are never shown to the room.</p>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
