-- Invitation and lobby readiness v1. All functions remain service-role only;
-- participant credentials and invitation hashes never appear in their results.
create or replace function public.replace_session_invitation_v1(
  p_session_id uuid,
  p_host_participant_access_token_hash text,
  p_invitation_token_hash text
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_session public.decision_sessions; v_host public.session_participants; v_invitation public.session_invitations;
begin
  if p_host_participant_access_token_hash !~ '^[a-f0-9]{64}$' or p_invitation_token_hash !~ '^[a-f0-9]{64}$' then raise exception using errcode = '22023'; end if;
  select * into v_session from public.decision_sessions where id = p_session_id for update;
  if not found then raise exception using errcode = '22023'; end if;
  if v_session.status not in ('DRAFT', 'LOBBY') then raise exception using errcode = '55000'; end if;
  select * into v_host from public.session_participants where session_id = p_session_id and role = 'HOST' and participant_access_token_hash = p_host_participant_access_token_hash;
  if not found then raise exception using errcode = '42501'; end if;
  update public.session_invitations set revoked_at = pg_catalog.now() where session_id = p_session_id and revoked_at is null and expires_at > pg_catalog.now();
  insert into public.session_invitations(session_id, invitation_token_hash, expires_at)
  values (p_session_id, p_invitation_token_hash, pg_catalog.now() + interval '24 hours') returning * into v_invitation;
  return pg_catalog.jsonb_build_object('id', v_invitation.id, 'sessionId', v_invitation.session_id, 'expiresAt', v_invitation.expires_at, 'status', 'ACTIVE');
end; $$;

create or replace function public.revoke_session_invitation_v1(
  p_session_id uuid, p_host_participant_access_token_hash text
)
returns void language plpgsql security definer set search_path = '' as $$
declare v_session public.decision_sessions;
begin
  if p_host_participant_access_token_hash !~ '^[a-f0-9]{64}$' then raise exception using errcode = '22023'; end if;
  select * into v_session from public.decision_sessions where id = p_session_id for update;
  if not found then raise exception using errcode = '22023'; end if;
  if v_session.status not in ('DRAFT', 'LOBBY') then raise exception using errcode = '55000'; end if;
  if not exists (select 1 from public.session_participants where session_id = p_session_id and role = 'HOST' and participant_access_token_hash = p_host_participant_access_token_hash) then raise exception using errcode = '42501'; end if;
  update public.session_invitations set revoked_at = pg_catalog.now() where session_id = p_session_id and revoked_at is null and expires_at > pg_catalog.now();
end; $$;

create or replace function public.update_participant_readiness_v1(
  p_session_id uuid, p_participant_access_token_hash text, p_readiness text
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_session public.decision_sessions; v_participant public.session_participants;
begin
  if p_participant_access_token_hash !~ '^[a-f0-9]{64}$' or p_readiness not in ('WAITING', 'READY') then raise exception using errcode = '22023'; end if;
  select * into v_session from public.decision_sessions where id = p_session_id for update;
  if not found then raise exception using errcode = '22023'; end if;
  if v_session.status <> 'LOBBY' then raise exception using errcode = '55000'; end if;
  update public.session_participants set readiness = p_readiness
  where session_id = p_session_id and participant_access_token_hash = p_participant_access_token_hash
  returning * into v_participant;
  if not found then raise exception using errcode = '42501'; end if;
  return pg_catalog.jsonb_build_object('id',v_participant.id,'displayName',v_participant.display_name,'role',v_participant.role,'readiness',v_participant.readiness);
end; $$;

create or replace function public.start_lobby_voting_v1(p_session_id uuid, p_host_participant_access_token_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_session public.decision_sessions; v_host public.session_participants; v_count integer; v_ready integer;
begin
  if p_host_participant_access_token_hash !~ '^[a-f0-9]{64}$' then raise exception using errcode = '22023'; end if;
  select * into v_session from public.decision_sessions where id = p_session_id for update;
  if not found then raise exception using errcode = '22023'; end if;
  if v_session.status <> 'LOBBY' then raise exception using errcode = '55000'; end if;
  select * into v_host from public.session_participants where session_id = p_session_id and role = 'HOST' and participant_access_token_hash = p_host_participant_access_token_hash;
  if not found then raise exception using errcode = '42501'; end if;
  select count(*), count(*) filter (where readiness = 'READY') into v_count, v_ready from public.session_participants where session_id = p_session_id;
  if v_count < 2 or v_ready <> v_count then raise exception using errcode = '23514'; end if;
  update public.decision_sessions set status = 'VOTING' where id = p_session_id;
  return public.participant_room_v1(p_session_id, v_host.id);
end; $$;

-- Ensure initial invitations obey the same v1 twenty-four-hour policy.
create or replace function public.create_decision_session_v1(
  p_title text, p_category text, p_mode text, p_options jsonb, p_host_display_name text,
  p_invitation_token_hash text, p_host_participant_access_token_hash text
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_session public.decision_sessions; v_host public.session_participants; v_option jsonb; v_position integer := 0;
begin
  if p_title is null or pg_catalog.char_length(pg_catalog.btrim(p_title)) not between 1 and 120 or p_host_display_name is null or pg_catalog.char_length(pg_catalog.btrim(p_host_display_name)) not between 1 and 60 or p_category not in ('EAT','DO','WATCH','CUSTOM') or p_mode not in ('INSTANT_MATCH','BEST_FIT','CHAOS') or p_invitation_token_hash !~ '^[a-f0-9]{64}$' or p_host_participant_access_token_hash !~ '^[a-f0-9]{64}$' then raise exception using errcode = '23514'; end if;
  if pg_catalog.jsonb_typeof(p_options) <> 'array' or pg_catalog.jsonb_array_length(p_options) not between 2 and 12 or exists (select 1 from pg_catalog.jsonb_array_elements(p_options) o(value) where pg_catalog.jsonb_typeof(o.value) is distinct from 'object' or pg_catalog.jsonb_typeof(o.value -> 'label') is distinct from 'string' or pg_catalog.char_length(pg_catalog.btrim(o.value ->> 'label')) not between 1 and 160) then raise exception using errcode = '23514'; end if;
  insert into public.decision_sessions(title,category,mode,status) values (p_title,p_category,p_mode,'LOBBY') returning * into v_session;
  insert into public.session_participants(session_id,display_name,role,readiness,participant_access_token_hash) values (v_session.id,p_host_display_name,'HOST','WAITING',p_host_participant_access_token_hash) returning * into v_host;
  for v_option in select o.value from pg_catalog.jsonb_array_elements(p_options) o(value) loop insert into public.decision_options(session_id,label,position,eligible) values (v_session.id,v_option ->> 'label',v_position,true); v_position := v_position + 1; end loop;
  perform public.assert_session_option_count(v_session.id);
  insert into public.session_invitations(session_id,invitation_token_hash,expires_at) values (v_session.id,p_invitation_token_hash,pg_catalog.now() + interval '24 hours');
  return pg_catalog.jsonb_build_object('session_id',v_session.id,'participant_id',v_host.id,'room',public.participant_room_v1(v_session.id,v_host.id));
end; $$;

create or replace function public.join_decision_session_v1(p_invitation_token_hash text, p_display_name text, p_participant_access_token_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_invitation public.session_invitations; v_session public.decision_sessions; v_participant public.session_participants; v_session_id uuid;
begin
  if p_invitation_token_hash !~ '^[a-f0-9]{64}$' or p_participant_access_token_hash !~ '^[a-f0-9]{64}$' or p_display_name is null or pg_catalog.char_length(pg_catalog.btrim(p_display_name)) not between 1 and 60 then raise exception using errcode='23514'; end if;
  select session_id into v_session_id from public.session_invitations where invitation_token_hash=p_invitation_token_hash and revoked_at is null and expires_at > pg_catalog.now();
  if not found then raise exception using errcode='22023'; end if;
  select * into v_session from public.decision_sessions where id=v_session_id for update;
  select * into v_invitation from public.session_invitations where invitation_token_hash=p_invitation_token_hash and session_id=v_session_id and revoked_at is null and expires_at > pg_catalog.now();
  if not found then raise exception using errcode='22023'; end if;
  if v_session.status not in ('DRAFT','LOBBY') then raise exception using errcode='55000'; end if;
  insert into public.session_participants(session_id,display_name,role,readiness,participant_access_token_hash) values(v_invitation.session_id,p_display_name,'GUEST','WAITING',p_participant_access_token_hash) returning * into v_participant;
  return pg_catalog.jsonb_build_object('session_id',v_invitation.session_id,'participant_id',v_participant.id,'room',public.participant_room_v1(v_invitation.session_id,v_participant.id));
end; $$;

revoke all on function public.replace_session_invitation_v1(uuid,text,text), public.revoke_session_invitation_v1(uuid,text), public.update_participant_readiness_v1(uuid,text,text), public.start_lobby_voting_v1(uuid,text) from public, anon, authenticated;
grant execute on function public.replace_session_invitation_v1(uuid,text,text), public.revoke_session_invitation_v1(uuid,text), public.update_participant_readiness_v1(uuid,text,text), public.start_lobby_voting_v1(uuid,text) to service_role;
