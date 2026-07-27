-- v1 decision policies are enforced inside server-only RPCs. Individual ballots
-- remain private and no selection detail is returned beyond the final receipt.
create or replace function public.submit_private_ballot_v1(
  p_session_id uuid, p_participant_access_token_hash text, p_ballots jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_session public.decision_sessions; v_participant public.session_participants; v_count integer; v_finished integer;
begin
  if p_participant_access_token_hash !~ '^[a-f0-9]{64}$' or pg_catalog.jsonb_typeof(p_ballots) <> 'array' then raise exception using errcode='22023'; end if;
  select * into v_session from public.decision_sessions where id=p_session_id for update;
  if not found then raise exception using errcode='22023'; end if;
  if v_session.status <> 'VOTING' then raise exception using errcode='55000'; end if;
  select * into v_participant from public.session_participants where session_id=p_session_id and participant_access_token_hash=p_participant_access_token_hash;
  if not found then raise exception using errcode='42501'; end if;
  select count(*) into v_count from public.decision_options where session_id=p_session_id;
  if pg_catalog.jsonb_array_length(p_ballots) <> v_count
    or exists (select 1 from pg_catalog.jsonb_array_elements(p_ballots) b(value) where pg_catalog.jsonb_typeof(b.value) <> 'object' or (b.value->>'optionId') is null or (b.value->>'value') not in ('LOVE','FINE','PASS','VETO'))
    or (select count(distinct b.value->>'optionId') from pg_catalog.jsonb_array_elements(p_ballots) b(value)) <> v_count
    or (select count(*) from pg_catalog.jsonb_array_elements(p_ballots) b(value) where b.value->>'value'='VETO') > 1
    or exists (select 1 from pg_catalog.jsonb_array_elements(p_ballots) b(value) left join public.decision_options o on o.id=(b.value->>'optionId')::uuid and o.session_id=p_session_id where o.id is null)
  then raise exception using errcode='23514'; end if;
  delete from public.private_ballots where participant_id=v_participant.id;
  insert into public.private_ballots(session_id,participant_id,option_id,value)
  select p_session_id,v_participant.id,(b.value->>'optionId')::uuid,b.value->>'value' from pg_catalog.jsonb_array_elements(p_ballots) b(value);
  select count(*) into v_finished from public.session_participants p where p.session_id=p_session_id and (select count(*) from public.private_ballots b where b.participant_id=p.id)=v_count;
  return pg_catalog.jsonb_build_object('participantCount',(select count(*) from public.session_participants where session_id=p_session_id),'finishedParticipantCount',v_finished);
end; $$;

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
    select o.id into v_winner from public.decision_options o where o.session_id=p_session_id and o.eligible and not exists (select 1 from public.private_ballots b where b.option_id=o.id and b.value='VETO') and not exists (select 1 from public.session_participants p where p.session_id=p_session_id and not exists (select 1 from public.private_ballots b where b.participant_id=p.id and b.option_id=o.id and b.value in ('LOVE','FINE'))) order by o.position limit 1;
    v_explanation := 'Selected because every participant accepted this eligible option; individual ballots are never revealed.';
  elsif v_session.mode='CHAOS' then
    select o.id into v_winner from public.decision_options o where o.session_id=p_session_id and o.eligible and not exists (select 1 from public.private_ballots b where b.option_id=o.id and b.value='VETO') and exists (select 1 from public.private_ballots b where b.option_id=o.id and b.value in ('LOVE','FINE')) order by md5(p_session_id::text || o.id::text) limit 1;
    v_explanation := 'Selected deterministically from eligible, group-accepted options; individual ballots are never revealed.';
  else
    select o.id into v_winner from public.decision_options o where o.session_id=p_session_id and o.eligible and not exists (select 1 from public.private_ballots b where b.option_id=o.id and b.value='VETO') order by (select coalesce(sum(case b.value when 'LOVE' then 3 when 'FINE' then 1 else 0 end),0) from public.private_ballots b where b.option_id=o.id) desc, o.position asc limit 1;
    v_explanation := 'Selected from aggregate private preferences; individual ballots are never revealed.';
  end if;
  if v_winner is null then raise exception using errcode='23514'; end if;
  insert into public.session_results(session_id,winner_option_id,method,explanation) values(p_session_id,v_winner,v_session.mode,v_explanation) returning * into v_result;
  update public.decision_sessions set status='DECIDED' where id=p_session_id;
  return pg_catalog.jsonb_build_object('id',v_result.id,'sessionId',v_result.session_id,'winnerOptionId',v_result.winner_option_id,'method',v_result.method,'explanation',v_result.explanation,'finalizedAt',v_result.finalized_at);
end; $$;
