import { AppShell } from '@/components/app-shell';
import { MockResultScreen } from '@/features/room/mock-result-screen';
export default function Page() {
  return (
    <AppShell>
      <MockResultScreen />
    </AppShell>
  );
}
