-- The seed is server-private and used only to make equal candidate selection
-- reproducible for a session without exposing randomness to clients.
alter table public.decision_sessions add column selection_seed uuid not null default gen_random_uuid();

create or replace function public.finalize_decision_v1(p_session_id uuid, p_host_participant_access_token_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_session public.decision_sessions; v_host public.session_participants; v_winner uuid; v_explanation text; v_result public.session_results; v_total integer; v_finished integer;
begin
  if p_host_participant_access_token_hash !~ '^[a-f0-9]{64}$' then raise exception using errcode='22023'; end if;
  select * into v_session from public.decision_sessions where id=p_session_id for update;
  if not found then raise exception using errcode='22023'; end if;
  if v_session.status = 'DECIDED' then select * into v_result from public.session_results where session_id=p_session_id; return pg_catalog.jsonb_build_object('id',v_result.id,'sessionId',v_result.session_id,'winnerOptionId',v_result.winner_option_id,'method',v_result.method,'explanation',v_result.explanation,'finalizedAt',v_result.finalized_at); end if;
  if v_session.status <> 'VOTING' then raise exception using errcode='55000'; end if;
  select * into v_host from public.session_participants where session_id=p_session_id and role='HOST' and participant_access_token_hash=p_host_participant_access_token_hash;
  if not found then raise exception using errcode='42501'; end if;
  select count(*) into v_total from public.session_participants where session_id=p_session_id;
  select count(*) into v_finished from public.session_participants p where p.session_id=p_session_id and (select count(*) from public.private_ballots b where b.participant_id=p.id)=(select count(*) from public.decision_options where session_id=p_session_id);
  if v_finished <> v_total then raise exception using errcode='23514'; end if;
  if v_session.mode='INSTANT_MATCH' then
    select o.id into v_winner from public.decision_options o where o.session_id=p_session_id and o.eligible and not exists (select 1 from public.private_ballots b where b.option_id=o.id and b.value='VETO') and not exists (select 1 from public.session_participants p where p.session_id=p_session_id and not exists (select 1 from public.private_ballots b where b.participant_id=p.id and b.option_id=o.id and b.value in ('LOVE','FINE'))) order by md5(v_session.selection_seed::text || o.id::text) limit 1;
    v_explanation := 'Selected from universally accepted eligible options using a server-locked tie seed; individual ballots are never revealed.';
  elsif v_session.mode='CHAOS' then
    select o.id into v_winner from public.decision_options o where o.session_id=p_session_id and o.eligible and not exists (select 1 from public.private_ballots b where b.option_id=o.id and b.value='VETO') and exists (select 1 from public.private_ballots b where b.option_id=o.id and b.value in ('LOVE','FINE')) order by md5(v_session.selection_seed::text || o.id::text) limit 1;
    v_explanation := 'Selected from eligible, group-accepted options using a server-locked seed; individual ballots are never revealed.';
  else
    select o.id into v_winner from public.decision_options o where o.session_id=p_session_id and o.eligible and not exists (select 1 from public.private_ballots b where b.option_id=o.id and b.value='VETO') order by (select coalesce(sum(case b.value when 'LOVE' then 3 when 'FINE' then 1 else 0 end),0) from public.private_ballots b where b.option_id=o.id) desc, md5(v_session.selection_seed::text || o.id::text) limit 1;
    v_explanation := 'Selected from aggregate private preferences with a server-locked tie seed; individual ballots are never revealed.';
  end if;
  if v_winner is null then raise exception using errcode='23514'; end if;
  insert into public.session_results(session_id,winner_option_id,method,explanation) values(p_session_id,v_winner,v_session.mode,v_explanation) returning * into v_result;
  update public.decision_sessions set status='DECIDED' where id=p_session_id;
  return pg_catalog.jsonb_build_object('id',v_result.id,'sessionId',v_result.session_id,'winnerOptionId',v_result.winner_option_id,'method',v_result.method,'explanation',v_result.explanation,'finalizedAt',v_result.finalized_at);
end; $$;
