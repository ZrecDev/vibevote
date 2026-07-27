import { AppShell } from '@/components/app-shell';
import { RoomBootstrap } from '@/features/room/room-bootstrap';
export default async function Page({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return (
    <AppShell>
      <RoomBootstrap sessionId={sessionId} />
    </AppShell>
  );
}
