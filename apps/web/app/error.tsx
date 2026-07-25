'use client';
import { useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui';
import { RoomState } from '@/features/room/room-screens';
export default function GlobalError({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <html lang="en">
      <body>
        <AppShell>
          <RoomState kind="error" />
          <Button onClick={reset}>Try again</Button>
        </AppShell>
      </body>
    </html>
  );
}
