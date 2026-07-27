'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BootstrapSessionResponse } from '@vibevote/contracts';
import { bootstrapSession, SessionClientError } from '@/features/session/session-client';
import { LobbyScreen, RoomState } from './room-screens';

const RECOVERY_INTERVAL_MS = 5_000;
type RoomLoadState = {
  loading: boolean;
  response?: BootstrapSessionResponse;
  error?: string;
};

export function RoomBootstrap({ sessionId }: { sessionId: string }) {
  const requestId = useRef(0);
  const [state, setState] = useState<RoomLoadState>({ loading: true });
  const load = useCallback(
    async (background = false) => {
      const currentRequest = ++requestId.current;
      if (!background) setState({ loading: true });
      try {
        const response = await bootstrapSession(sessionId);
        if (currentRequest === requestId.current) setState({ loading: false, response });
      } catch (reason) {
        if (currentRequest === requestId.current && !background)
          setState({
            loading: false,
            error:
              reason instanceof SessionClientError
                ? reason.message
                : 'We could not load this room.',
          });
      }
    },
    [sessionId],
  );
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void load();
    });
    return () => {
      active = false;
      requestId.current += 1;
    };
  }, [load]);
  useEffect(() => {
    const recover = () => {
      if (document.visibilityState === 'visible') void load(true);
    };
    const interval = window.setInterval(recover, RECOVERY_INTERVAL_MS);
    window.addEventListener('online', recover);
    document.addEventListener('visibilitychange', recover);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('online', recover);
      document.removeEventListener('visibilitychange', recover);
    };
  }, [load]);
  if (state.loading) return <RoomState kind="loading" />;
  if (state.error)
    return (
      <div className="stack">
        <RoomState kind="error" onRetry={() => void load()} />
        <p role="alert">{state.error}</p>
      </div>
    );
  return (
    <LobbyScreen
      room={state.response!.session}
      isHost={state.response!.kind === 'HOST'}
      onRefresh={() => void load()}
    />
  );
}
