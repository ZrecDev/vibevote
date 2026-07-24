import { AppShell } from '@/components/app-shell';
export default function Loading() {
  return (
    <AppShell>
      <p role="status" aria-live="polite">
        Loading VibeVote…
      </p>
    </AppShell>
  );
}
