import { AppShell } from '@/components/app-shell';
import { StateMessage } from '@/components/states';
export default function NotFound() {
  return (
    <AppShell>
      <StateMessage title="That page is not here">
        Check the link or return home to start a decision.
      </StateMessage>
    </AppShell>
  );
}
