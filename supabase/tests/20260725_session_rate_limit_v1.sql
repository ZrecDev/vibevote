begin;

do $$
declare
  v_first record;
  v_second record;
  v_denied record;
  v_preview record;
  v_other_project record;
  v_expired record;
begin
  select * into v_first from public.check_session_rate_limit_v1('production:prj_One', repeat('a', 64), 2, 1);
  select * into v_second from public.check_session_rate_limit_v1('production:prj_One', repeat('a', 64), 2, 1);
  select * into v_denied from public.check_session_rate_limit_v1('production:prj_One', repeat('a', 64), 2, 1);
  select * into v_preview from public.check_session_rate_limit_v1('preview:prj_One', repeat('a', 64), 2, 1);
  select * into v_other_project from public.check_session_rate_limit_v1('production:prj_Two', repeat('a', 64), 2, 1);

  assert v_first.allowed and v_first.remaining = 1;
  assert v_second.allowed and v_second.remaining = 0;
  assert not v_denied.allowed and v_denied.remaining = 0;
  assert v_preview.allowed and v_preview.remaining = 1;
  assert v_other_project.allowed and v_other_project.remaining = 1;

  perform pg_catalog.pg_sleep(1.1);
  select * into v_expired from public.check_session_rate_limit_v1('production:prj_One', repeat('a', 64), 2, 1);
  assert v_expired.allowed and v_expired.remaining = 1;

  assert not has_function_privilege('public', 'public.check_session_rate_limit_v1(text,text,integer,integer)', 'execute');
  assert not has_function_privilege('anon', 'public.check_session_rate_limit_v1(text,text,integer,integer)', 'execute');
  assert not has_function_privilege('authenticated', 'public.check_session_rate_limit_v1(text,text,integer,integer)', 'execute');
  assert has_function_privilege('service_role', 'public.check_session_rate_limit_v1(text,text,integer,integer)', 'execute');
  assert not has_table_privilege('anon', 'private.session_rate_limit_windows', 'select');
  assert not has_table_privilege('authenticated', 'private.session_rate_limit_windows', 'select');
  assert (select relrowsecurity from pg_class where oid = 'private.session_rate_limit_windows'::regclass);
end;
$$;

rollback;
