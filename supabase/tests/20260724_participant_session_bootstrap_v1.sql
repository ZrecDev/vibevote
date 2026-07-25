begin;

-- PostgreSQL column renames preserve stored values. This transaction models the
-- pre-migration guest column then exercises the exact additive rename behavior.
do $$
declare v_session_id uuid; v_host_id uuid; v_guest_id uuid;
begin
  alter table public.session_participants rename column participant_access_token_hash to guest_access_token_hash;
  insert into public.decision_sessions (title, category, mode, status)
  values ('Legacy participants', 'CUSTOM', 'BEST_FIT', 'LOBBY') returning id into v_session_id;
  insert into public.session_participants (session_id, display_name, role, readiness)
  values (v_session_id, 'Legacy host', 'HOST', 'WAITING') returning id into v_host_id;
  insert into public.session_participants (session_id, display_name, role, readiness, guest_access_token_hash)
  values (v_session_id, 'Legacy guest', 'GUEST', 'WAITING', repeat('a', 64)) returning id into v_guest_id;
  alter table public.session_participants rename column guest_access_token_hash to participant_access_token_hash;
  assert (select participant_access_token_hash from public.session_participants where id = v_guest_id) = repeat('a', 64);
  assert (select participant_access_token_hash from public.session_participants where id = v_host_id) is null;
end $$;

do $$
declare v_create jsonb; v_join jsonb; v_host_bootstrap jsonb; v_guest_bootstrap jsonb;
  v_session_id uuid; v_other_session_id uuid; v_before integer;
begin
  select public.create_decision_session_v1(
    'Credential session', 'CUSTOM', 'BEST_FIT', '[{"label":"One"},{"label":"Two"}]'::jsonb,
    'Host', repeat('b', 64), repeat('c', 64)
  ) into v_create;
  v_session_id := (v_create ->> 'session_id')::uuid;
  assert (select participant_access_token_hash from public.session_participants where id = (v_create ->> 'participant_id')::uuid) = repeat('c', 64);
  assert v_create::text !~ 'participant_access_token_hash|invitation_token_hash|cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';

  select public.join_decision_session_v1(repeat('b', 64), 'Guest', repeat('d', 64)) into v_join;
  assert (select participant_access_token_hash from public.session_participants where id = (v_join ->> 'participant_id')::uuid) = repeat('d', 64);
  assert v_join::text !~ 'participant_access_token_hash|invitation_token_hash|dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd';

  select public.get_participant_session_v1(v_session_id, repeat('c', 64)) into v_host_bootstrap;
  select public.get_participant_session_v1(v_session_id, repeat('d', 64)) into v_guest_bootstrap;
  assert v_host_bootstrap ->> 'role' = 'HOST';
  assert v_guest_bootstrap ->> 'role' = 'GUEST';
  assert v_host_bootstrap::text !~ 'participant_access_token_hash|invitation_token_hash|cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
  assert v_guest_bootstrap::text !~ 'hostControls|participant_access_token_hash|invitation_token_hash|dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd';

  begin
    perform public.get_participant_session_v1(
      (select id from public.decision_sessions where title = 'Legacy participants'), repeat('f', 64)
    );
    raise exception 'expected legacy host bootstrap failure';
  exception when invalid_parameter_value then null;
  end;

  insert into public.decision_sessions (title, category, mode, status)
  values ('Other session', 'CUSTOM', 'BEST_FIT', 'LOBBY') returning id into v_other_session_id;
  for v_before in 1..3 loop
    begin
      perform public.get_participant_session_v1(
        case v_before when 1 then v_other_session_id else v_session_id end,
        case v_before when 1 then repeat('c', 64) when 2 then repeat('e', 64) else null end
      );
      raise exception 'expected indistinguishable bootstrap failure';
    exception when invalid_parameter_value then null;
    end;
  end loop;

  select count(*) into v_before from public.decision_sessions;
  begin
    perform public.create_decision_session_v1('Bad hash', 'CUSTOM', 'BEST_FIT', '[{"label":"One"},{"label":"Two"}]', 'Host', '', repeat('f', 64));
    raise exception 'expected invalid create hash';
  exception when check_violation then null;
  end;
  assert (select count(*) from public.decision_sessions) = v_before;
  begin
    perform public.join_decision_session_v1(repeat('b', 64), 'Bad guest', repeat('c', 64));
    raise exception 'expected duplicate participant hash';
  exception when unique_violation then null;
  end;
end $$;

do $$
declare table_name text;
begin
  assert not has_function_privilege('public', 'public.get_participant_session_v1(uuid,text)', 'execute');
  assert not has_function_privilege('anon', 'public.get_participant_session_v1(uuid,text)', 'execute');
  assert not has_function_privilege('authenticated', 'public.get_participant_session_v1(uuid,text)', 'execute');
  assert has_function_privilege('service_role', 'public.get_participant_session_v1(uuid,text)', 'execute');
  assert (select relrowsecurity from pg_class where oid = 'public.session_participants'::regclass);
  for table_name in select unnest(array['decision_sessions','decision_options','session_participants','session_invitations']) loop
    assert not has_table_privilege('anon', 'public.' || table_name, 'select,insert,update,delete');
    assert not has_table_privilege('authenticated', 'public.' || table_name, 'select,insert,update,delete');
  end loop;
end $$;

rollback;
