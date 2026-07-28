'use client';
import { useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { RoomState } from '@/features/room/room-screens';
export default function GlobalError({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <AppShell>
      <RoomState kind="error" onRetry={reset} />
    </AppShell>
  );
}
