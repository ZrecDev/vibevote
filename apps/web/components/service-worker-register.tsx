'use client';

import { useEffect } from 'react';

/** Registers only an app-shell cache; room APIs and private data are never cached. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined);
  }, []);
  return null;
}
