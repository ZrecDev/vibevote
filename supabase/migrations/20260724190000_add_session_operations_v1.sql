-- Server-owned, atomic session operations. These functions expose no token hashes.
create or replace function public.create_decision_session_v1(
  p_title text,
  p_category text,
  p_mode text,
  p_options jsonb,
  p_host_display_name text,
  p_invitation_token_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.decision_sessions;
  v_host public.session_participants;
  v_option jsonb;
  v_position integer := 0;
begin
  if p_title is null or pg_catalog.char_length(pg_catalog.btrim(p_title)) not between 1 and 120
    or p_host_display_name is null or pg_catalog.char_length(pg_catalog.btrim(p_host_display_name)) not between 1 and 60
    or p_category not in ('EAT', 'DO', 'WATCH', 'CUSTOM')
    or p_mode not in ('INSTANT_MATCH', 'BEST_FIT', 'CHAOS')
    or p_invitation_token_hash !~ '^[a-f0-9]{64}$'
  then
    raise exception using errcode = '23514';
  end if;

  if pg_catalog.jsonb_typeof(p_options) <> 'array'
    or pg_catalog.jsonb_array_length(p_options) not between 2 and 12
    or exists (
      select 1
      from pg_catalog.jsonb_array_elements(p_options) as option_value(value)
      where pg_catalog.jsonb_typeof(option_value.value) is distinct from 'object'
        or pg_catalog.jsonb_typeof(option_value.value -> 'label') is distinct from 'string'
        or pg_catalog.char_length(pg_catalog.btrim(option_value.value ->> 'label')) not between 1 and 160
    )
  then
    raise exception using errcode = '23514';
  end if;

  insert into public.decision_sessions (title, category, mode, status)
  values (p_title, p_category, p_mode, 'LOBBY')
  returning * into v_session;

  insert into public.session_participants (session_id, display_name, role, readiness)
  values (v_session.id, p_host_display_name, 'HOST', 'WAITING')
  returning * into v_host;

  for v_option in
    select option_value.value
    from pg_catalog.jsonb_array_elements(p_options) as option_value(value)
  loop
    insert into public.decision_options (session_id, label, position, eligible)
    values (v_session.id, v_option ->> 'label', v_position, true);
    v_position := v_position + 1;
  end loop;

  perform public.assert_session_option_count(v_session.id);

  insert into public.session_invitations (session_id, invitation_token_hash)
  values (v_session.id, p_invitation_token_hash);

  return pg_catalog.jsonb_build_object(
    'session_id', v_session.id,
    'participant_id', v_host.id,
    'session', pg_catalog.jsonb_build_object(
      'id', v_session.id,
      'title', v_session.title,
      'category', v_session.category,
      'mode', v_session.mode,
      'status', v_session.status
    ),
    'participant', pg_catalog.jsonb_build_object(
      'id', v_host.id,
      'display_name', v_host.display_name,
      'role', v_host.role,
      'readiness', v_host.readiness
    ),
    'room', pg_catalog.jsonb_build_object(
      'session', pg_catalog.jsonb_build_object('id', v_session.id, 'title', v_session.title, 'category', v_session.category, 'mode', v_session.mode, 'status', v_session.status, 'options', (select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id', id, 'label', label, 'order', position, 'eligible', eligible) order by position), '[]'::jsonb) from public.decision_options where session_id = v_session.id)),
      'participants', (select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id', id, 'displayName', display_name, 'role', role, 'readiness', readiness) order by joined_at) from public.session_participants where session_id = v_session.id),
      'finishedParticipantCount', 0,
      'result', null,
      'currentParticipantId', v_host.id
    )
  );
end;
$$;

create or replace function public.join_decision_session_v1(
  p_invitation_token_hash text,
  p_display_name text,
  p_guest_access_token_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation public.session_invitations;
  v_session public.decision_sessions;
  v_participant public.session_participants;
begin
  if p_invitation_token_hash !~ '^[a-f0-9]{64}$'
    or p_guest_access_token_hash !~ '^[a-f0-9]{64}$'
    or p_display_name is null
    or pg_catalog.char_length(pg_catalog.btrim(p_display_name)) not between 1 and 60
  then
    raise exception using errcode = '23514';
  end if;

  select *
  into v_invitation
  from public.session_invitations
  where invitation_token_hash = p_invitation_token_hash
    and revoked_at is null
    and (expires_at is null or expires_at > pg_catalog.now());

  if not found then
    raise exception using errcode = '22023';
  end if;

  select * into v_session from public.decision_sessions where id = v_invitation.session_id;

  insert into public.session_participants (
    session_id,
    display_name,
    role,
    readiness,
    guest_access_token_hash
  )
  values (
    v_invitation.session_id,
    p_display_name,
    'GUEST',
    'WAITING',
    p_guest_access_token_hash
  )
  returning * into v_participant;

  return pg_catalog.jsonb_build_object(
    'session_id', v_session.id,
    'participant_id', v_participant.id,
    'session', pg_catalog.jsonb_build_object(
      'id', v_session.id,
      'title', v_session.title,
      'category', v_session.category,
      'mode', v_session.mode,
      'status', v_session.status
    ),
    'participant', pg_catalog.jsonb_build_object(
      'id', v_participant.id,
      'display_name', v_participant.display_name,
      'role', v_participant.role,
      'readiness', v_participant.readiness
    ),
    'room', pg_catalog.jsonb_build_object(
      'session', pg_catalog.jsonb_build_object('id', v_session.id, 'title', v_session.title, 'category', v_session.category, 'mode', v_session.mode, 'status', v_session.status, 'options', (select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id', id, 'label', label, 'order', position, 'eligible', eligible) order by position), '[]'::jsonb) from public.decision_options where session_id = v_session.id)),
      'participants', (select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id', id, 'displayName', display_name, 'role', role, 'readiness', readiness) order by joined_at) from public.session_participants where session_id = v_session.id),
      'finishedParticipantCount', (select count(*) from public.session_participants where session_id = v_session.id and readiness = 'READY'),
      'result', null,
      'currentParticipantId', v_participant.id
    )
  );
end;
$$;

revoke all on function public.create_decision_session_v1(text, text, text, jsonb, text, text)
  from public, anon, authenticated;
revoke all on function public.join_decision_session_v1(text, text, text)
  from public, anon, authenticated;

grant execute on function public.create_decision_session_v1(text, text, text, jsonb, text, text)
  to service_role;
grant execute on function public.join_decision_session_v1(text, text, text)
  to service_role;
