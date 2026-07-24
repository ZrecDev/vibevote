import { AppShell } from '@/components/app-shell';
import { StateMessage } from '@/components/states';
export function PlaceholderPage({ title }: Readonly<{ title: string }>) {
  return (
    <AppShell>
      <StateMessage title={title}>
        This feature has not been implemented yet. The foundation intentionally contains no
        sessions, voting, authentication, or realtime behavior.
      </StateMessage>
    </AppShell>
  );
}
