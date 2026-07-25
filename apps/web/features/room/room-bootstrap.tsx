'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BootstrapSessionResponse } from '@vibevote/contracts';
import { bootstrapSession, SessionClientError } from '@/features/session/session-client';
import { LobbyScreen, RoomState } from './room-screens';

export function RoomBootstrap({ sessionId }: { sessionId: string }) {
  const requestId = useRef(0);
  const [state, setState] = useState<{
    loading: boolean;
    response?: BootstrapSessionResponse;
    error?: string;
  }>({ loading: true });
  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setState({ loading: true });
    try {
      const response = await bootstrapSession(sessionId);
      if (currentRequest === requestId.current) setState({ loading: false, response });
    } catch (reason) {
      if (currentRequest === requestId.current)
        setState({
          loading: false,
          error:
            reason instanceof SessionClientError ? reason.message : 'We could not load this room.',
        });
    }
  }, [sessionId]);
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
  if (state.loading) return <RoomState kind="loading" />;
  if (state.error)
    return (
      <div className="stack">
        <RoomState kind="error" onRetry={() => void load()} />
        <p role="alert">{state.error}</p>
      </div>
    );
  return <LobbyScreen room={state.response!.session} isHost={state.response!.kind === 'HOST'} />;
}
