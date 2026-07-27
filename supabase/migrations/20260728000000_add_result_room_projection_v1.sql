-- Result projection is deliberately summary-only: ballots and result identifiers
-- remain server-private. The authenticated bootstrap invokes this function.
create or replace function public.participant_room_v1(p_session_id uuid, p_participant_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select pg_catalog.jsonb_build_object(
    'session', pg_catalog.jsonb_build_object('id',s.id,'title',s.title,'category',s.category,'mode',s.mode,'status',s.status,'options',(select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id',o.id,'label',o.label,'order',o.position,'eligible',o.eligible) order by o.position),'[]'::jsonb) from public.decision_options o where o.session_id=s.id)),
    'participants',(select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id',p.id,'displayName',p.display_name,'role',p.role,'readiness',p.readiness) order by p.joined_at),'[]'::jsonb) from public.session_participants p where p.session_id=s.id),
    'finishedParticipantCount',(select pg_catalog.count(*) from public.session_participants p where p.session_id=s.id and p.readiness='READY'),
    'result',(select pg_catalog.jsonb_build_object('winnerOptionId',r.winner_option_id,'method',r.method,'explanation',r.explanation,'finalizedAt',pg_catalog.to_char(r.finalized_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) from public.session_results r where r.session_id=s.id),
    'currentParticipantId',p_participant_id)
  from public.decision_sessions s where s.id=p_session_id;
$$;
