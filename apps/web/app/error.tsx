'use client';
import { useEffect } from 'react';
import { Button } from '@/components/ui';
export default function GlobalError({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <html lang="en">
      <body className="p-6">
        <main>
          <h1>Something went wrong</h1>
          <p>Try again. If this keeps happening, return to the start page.</p>
          <Button onClick={reset}>Try again</Button>
        </main>
      </body>
    </html>
  );
}
