-- Forward repair for the initial function definition; no table or privilege changes.
create or replace function public.check_session_rate_limit_v1(
  p_namespace text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_window_started_at timestamptz;
  v_request_count integer;
begin
  if p_namespace !~ '^(preview|production)$'
    or p_key_hash !~ '^[a-f0-9]{64}$'
    or p_limit not between 1 and 1000
    or p_window_seconds not between 1 and 86400
  then
    raise exception using errcode = '22023';
  end if;

  v_window_started_at := pg_catalog.to_timestamp(
    pg_catalog.floor(pg_catalog.date_part('epoch', v_now) / p_window_seconds) * p_window_seconds
  );

  delete from private.session_rate_limit_windows
  where ctid in (
    select ctid
    from private.session_rate_limit_windows
    where window_started_at < v_now - interval '24 hours'
    order by window_started_at
    limit 100
  );

  insert into private.session_rate_limit_windows as current_window (
    namespace,
    key_hash,
    window_started_at,
    request_count
  )
  values (p_namespace, p_key_hash, v_window_started_at, 1)
  on conflict (namespace, key_hash) do update
  set
    window_started_at = excluded.window_started_at,
    request_count = case
      when current_window.window_started_at = excluded.window_started_at
        then current_window.request_count + 1
      else 1
    end
  returning request_count into v_request_count;

  return query
  select
    v_request_count <= p_limit,
    greatest(p_limit - v_request_count, 0),
    v_window_started_at + (p_window_seconds * interval '1 second');
end;
$$;
