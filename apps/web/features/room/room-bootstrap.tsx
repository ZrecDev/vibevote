'use client';

import { useCallback, useEffect, useState } from 'react';
import type { BootstrapSessionResponse } from '@vibevote/contracts';
import { bootstrapSession, SessionClientError } from '@/features/session/session-client';
import { LobbyScreen, RoomState } from './room-screens';

export function RoomBootstrap({ sessionId }: { sessionId: string }) {
  const [state, setState] = useState<{
    loading: boolean;
    response?: BootstrapSessionResponse;
    error?: string;
  }>({ loading: true });
  const load = useCallback(async () => {
    setState({ loading: true });
    try {
      setState({ loading: false, response: await bootstrapSession(sessionId) });
    } catch (reason) {
      setState({
        loading: false,
        error:
          reason instanceof SessionClientError ? reason.message : 'We could not load this room.',
      });
    }
  }, [sessionId]);
  useEffect(() => {
    let active = true;
    void bootstrapSession(sessionId).then(
      (response) => active && setState({ loading: false, response }),
      (reason: unknown) =>
        active &&
        setState({
          loading: false,
          error:
            reason instanceof SessionClientError ? reason.message : 'We could not load this room.',
        }),
    );
    return () => {
      active = false;
    };
  }, [sessionId]);
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
