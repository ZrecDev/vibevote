begin;

do $$
declare
  v_create_result jsonb;
  v_join_result jsonb;
  v_session_id uuid;
  v_before_count integer;
begin
  select public.create_decision_session_v1(
    'Two choices',
    'EAT',
    'BEST_FIT',
    '[{"label":"First"},{"label":"Second"}]'::jsonb,
    'Host',
    repeat('a', 64),
    repeat('b', 64)
  ) into v_create_result;

  assert v_create_result ? 'session_id' and v_create_result ? 'participant_id';
  assert not (v_create_result::text like '%aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa%');
  v_session_id := (v_create_result ->> 'session_id')::uuid;
  assert (select count(*) from public.session_participants where session_id = v_session_id and role = 'HOST') = 1;
  assert (select array_agg(label order by position) from public.decision_options where session_id = v_session_id)
    = array['First', 'Second'];
  assert (select invitation_token_hash from public.session_invitations where session_id = v_session_id) = repeat('a', 64);

  select public.join_decision_session_v1(repeat('a', 64), 'Guest', repeat('c', 64)) into v_join_result;
  assert (v_join_result ->> 'session_id')::uuid = v_session_id;
  assert not (v_join_result::text like '%cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc%');
  assert (select participant_access_token_hash from public.session_participants where id = (v_join_result ->> 'participant_id')::uuid)
    = repeat('c', 64);

  select count(*) into v_before_count from public.decision_sessions;
  begin
    perform public.create_decision_session_v1(
      'Rollback',
      'EAT',
      'BEST_FIT',
      '[{"label":"One"},{"label":"Two"}]'::jsonb,
      'Host',
      repeat('a', 64),
      repeat('d', 64)
    );
    raise exception 'expected duplicate invitation failure';
  exception when unique_violation then null;
  end;
  assert (select count(*) from public.decision_sessions) = v_before_count;

  begin
    perform public.create_decision_session_v1('Too few', 'EAT', 'BEST_FIT', '[{"label":"One"}]'::jsonb, 'Host', repeat('e', 64), repeat('f', 64));
    raise exception 'expected option-count failure';
  exception when check_violation then null;
  end;
  begin
    perform public.create_decision_session_v1('Bad option', 'EAT', 'BEST_FIT', '[{"label":"One"},{}]'::jsonb, 'Host', repeat('1', 64), repeat('2', 64));
    raise exception 'expected option validation failure';
  exception when check_violation then null;
  end;
  begin
    perform public.join_decision_session_v1(repeat('3', 64), 'Guest', repeat('4', 64));
    raise exception 'expected invalid invitation failure';
  exception when invalid_parameter_value then null;
  end;
end;
$$;

do $$
declare
  v_twelve_options jsonb := '[]'::jsonb;
  v_index integer;
begin
  for v_index in 1..12 loop
    v_twelve_options := v_twelve_options || pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object('label', 'Option ' || v_index)
    );
  end loop;
  perform public.create_decision_session_v1('Twelve choices', 'DO', 'CHAOS', v_twelve_options, 'Host', repeat('5', 64), repeat('6', 64));
end;
$$;

do $$
declare
  v_session_id uuid;
begin
  insert into public.decision_sessions (title, category, mode, status)
  values ('Revoked', 'EAT', 'BEST_FIT', 'LOBBY') returning id into v_session_id;
  insert into public.session_invitations (session_id, invitation_token_hash, revoked_at)
  values (v_session_id, repeat('2', 64), pg_catalog.now());
  begin
    perform public.join_decision_session_v1(repeat('2', 64), 'Guest', repeat('3', 64));
    raise exception 'expected revoked invitation failure';
  exception when invalid_parameter_value then null;
  end;

  insert into public.decision_sessions (title, category, mode, status)
  values ('Expired', 'EAT', 'BEST_FIT', 'LOBBY') returning id into v_session_id;
  insert into public.session_invitations (session_id, invitation_token_hash, expires_at)
  values (v_session_id, repeat('4', 64), pg_catalog.now() - interval '1 second');
  begin
    perform public.join_decision_session_v1(repeat('4', 64), 'Guest', repeat('5', 64));
    raise exception 'expected expired invitation failure';
  exception when invalid_parameter_value then null;
  end;
end;
$$;

do $$
begin
  assert not has_function_privilege('public', 'public.create_decision_session_v1(text,text,text,jsonb,text,text,text)', 'execute');
  assert not has_function_privilege('anon', 'public.create_decision_session_v1(text,text,text,jsonb,text,text,text)', 'execute');
  assert not has_function_privilege('authenticated', 'public.create_decision_session_v1(text,text,text,jsonb,text,text,text)', 'execute');
  assert has_function_privilege('service_role', 'public.create_decision_session_v1(text,text,text,jsonb,text,text,text)', 'execute');
  assert not has_function_privilege('public', 'public.join_decision_session_v1(text,text,text)', 'execute');
  assert not has_function_privilege('anon', 'public.join_decision_session_v1(text,text,text)', 'execute');
  assert not has_function_privilege('authenticated', 'public.join_decision_session_v1(text,text,text)', 'execute');
  assert has_function_privilege('service_role', 'public.join_decision_session_v1(text,text,text)', 'execute');
  assert not has_table_privilege('anon', 'public.decision_sessions', 'select');
  assert not has_table_privilege('authenticated', 'public.decision_sessions', 'select');
  assert (select relrowsecurity from pg_class where oid = 'public.decision_sessions'::regclass);
end;
$$;

rollback;
