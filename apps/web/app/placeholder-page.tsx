import { AppShell } from '@/components/app-shell';
import { StateMessage } from '@/components/states';
export function PlaceholderPage({ title }: Readonly<{ title: string }>) {
  return (
    <AppShell>
      <StateMessage title={title}>
        This feature is not part of the first-session flow yet. Create or join a room to make a
        private group decision.
      </StateMessage>
    </AppShell>
  );
}
