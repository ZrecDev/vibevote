-- Unified participant credentials. Existing guest hashes are preserved; legacy hosts remain null
-- and cannot resume through get_participant_session_v1 until they receive a newly issued credential.
alter table public.session_participants
  rename column guest_access_token_hash to participant_access_token_hash;

alter table public.session_participants
  drop constraint session_participants_check;

alter table public.session_participants
  add constraint session_participants_participant_access_token_hash_check
  check (
    participant_access_token_hash is null
    or participant_access_token_hash ~ '^[a-f0-9]{64}$'
  );

create unique index session_participants_participant_access_token_hash_unique
  on public.session_participants (participant_access_token_hash)
  where participant_access_token_hash is not null;

drop function public.create_decision_session_v1(text, text, text, jsonb, text, text);

create function public.create_decision_session_v1(
  p_title text, p_category text, p_mode text, p_options jsonb, p_host_display_name text,
  p_invitation_token_hash text, p_host_participant_access_token_hash text
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_session public.decision_sessions; v_host public.session_participants; v_option jsonb; v_position integer := 0;
begin
  if p_title is null or pg_catalog.char_length(pg_catalog.btrim(p_title)) not between 1 and 120
    or p_host_display_name is null or pg_catalog.char_length(pg_catalog.btrim(p_host_display_name)) not between 1 and 60
    or p_category not in ('EAT','DO','WATCH','CUSTOM') or p_mode not in ('INSTANT_MATCH','BEST_FIT','CHAOS')
    or p_invitation_token_hash !~ '^[a-f0-9]{64}$' or p_host_participant_access_token_hash !~ '^[a-f0-9]{64}$'
  then raise exception using errcode = '23514'; end if;
  if pg_catalog.jsonb_typeof(p_options) <> 'array' or pg_catalog.jsonb_array_length(p_options) not between 2 and 12
    or exists (select 1 from pg_catalog.jsonb_array_elements(p_options) o(value) where pg_catalog.jsonb_typeof(o.value) is distinct from 'object' or pg_catalog.jsonb_typeof(o.value -> 'label') is distinct from 'string' or pg_catalog.char_length(pg_catalog.btrim(o.value ->> 'label')) not between 1 and 160)
  then raise exception using errcode = '23514'; end if;
  insert into public.decision_sessions(title,category,mode,status) values (p_title,p_category,p_mode,'LOBBY') returning * into v_session;
  insert into public.session_participants(session_id,display_name,role,readiness,participant_access_token_hash) values (v_session.id,p_host_display_name,'HOST','WAITING',p_host_participant_access_token_hash) returning * into v_host;
  for v_option in select o.value from pg_catalog.jsonb_array_elements(p_options) o(value) loop
    insert into public.decision_options(session_id,label,position,eligible) values (v_session.id,v_option ->> 'label',v_position,true); v_position := v_position + 1;
  end loop;
  perform public.assert_session_option_count(v_session.id);
  insert into public.session_invitations(session_id,invitation_token_hash) values (v_session.id,p_invitation_token_hash);
  return pg_catalog.jsonb_build_object('session_id',v_session.id,'participant_id',v_host.id,'room',public.participant_room_v1(v_session.id,v_host.id));
end; $$;

create or replace function public.participant_room_v1(p_session_id uuid, p_participant_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select pg_catalog.jsonb_build_object(
    'session', pg_catalog.jsonb_build_object('id',s.id,'title',s.title,'category',s.category,'mode',s.mode,'status',s.status,'options',(select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id',o.id,'label',o.label,'order',o.position,'eligible',o.eligible) order by o.position),'[]'::jsonb) from public.decision_options o where o.session_id=s.id)),
    'participants',(select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id',p.id,'displayName',p.display_name,'role',p.role,'readiness',p.readiness) order by p.joined_at),'[]'::jsonb) from public.session_participants p where p.session_id=s.id),
    'finishedParticipantCount',(select pg_catalog.count(*) from public.session_participants p where p.session_id=s.id and p.readiness='READY'),'result',null,'currentParticipantId',p_participant_id)
  from public.decision_sessions s where s.id=p_session_id;
$$;

drop function public.join_decision_session_v1(text, text, text);
create function public.join_decision_session_v1(p_invitation_token_hash text, p_display_name text, p_participant_access_token_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_invitation public.session_invitations; v_participant public.session_participants;
begin
  if p_invitation_token_hash !~ '^[a-f0-9]{64}$' or p_participant_access_token_hash !~ '^[a-f0-9]{64}$' or p_display_name is null or pg_catalog.char_length(pg_catalog.btrim(p_display_name)) not between 1 and 60 then raise exception using errcode='23514'; end if;
  select * into v_invitation from public.session_invitations where invitation_token_hash=p_invitation_token_hash and revoked_at is null and (expires_at is null or expires_at>pg_catalog.now());
  if not found then raise exception using errcode='22023'; end if;
  insert into public.session_participants(session_id,display_name,role,readiness,participant_access_token_hash) values(v_invitation.session_id,p_display_name,'GUEST','WAITING',p_participant_access_token_hash) returning * into v_participant;
  return pg_catalog.jsonb_build_object('session_id',v_invitation.session_id,'participant_id',v_participant.id,'room',public.participant_room_v1(v_invitation.session_id,v_participant.id));
end; $$;

create function public.get_participant_session_v1(p_session_id uuid, p_participant_access_token_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_participant public.session_participants;
begin
  if p_participant_access_token_hash !~ '^[a-f0-9]{64}$' then raise exception using errcode='22023'; end if;
  select * into v_participant from public.session_participants where session_id=p_session_id and participant_access_token_hash=p_participant_access_token_hash;
  if not found then raise exception using errcode='22023'; end if;
  return pg_catalog.jsonb_build_object('participant_id',v_participant.id,'role',v_participant.role,'room',public.participant_room_v1(p_session_id,v_participant.id));
end; $$;

revoke all on function public.participant_room_v1(uuid,uuid) from public, anon, authenticated;
revoke all on function public.create_decision_session_v1(text,text,text,jsonb,text,text,text) from public, anon, authenticated;
revoke all on function public.join_decision_session_v1(text,text,text) from public, anon, authenticated;
revoke all on function public.get_participant_session_v1(uuid,text) from public, anon, authenticated;
grant execute on function public.create_decision_session_v1(text,text,text,jsonb,text,text,text) to service_role;
grant execute on function public.join_decision_session_v1(text,text,text) to service_role;
grant execute on function public.get_participant_session_v1(uuid,text) to service_role;
