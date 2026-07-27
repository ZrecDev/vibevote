create or replace function public.update_option_eligibility_v1(
  p_session_id uuid, p_host_participant_access_token_hash text, p_option_id uuid, p_eligible boolean
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_session public.decision_sessions; v_host public.session_participants; v_option public.decision_options;
begin
  if p_host_participant_access_token_hash !~ '^[a-f0-9]{64}$' then raise exception using errcode='22023'; end if;
  select * into v_session from public.decision_sessions where id=p_session_id for update;
  if not found then raise exception using errcode='22023'; end if;
  if v_session.status not in ('DRAFT','LOBBY') then raise exception using errcode='55000'; end if;
  select * into v_host from public.session_participants where session_id=p_session_id and role='HOST' and participant_access_token_hash=p_host_participant_access_token_hash;
  if not found then raise exception using errcode='42501'; end if;
  select * into v_option from public.decision_options where id=p_option_id and session_id=p_session_id;
  if not found then raise exception using errcode='22023'; end if;
  if not p_eligible and v_option.eligible and (select count(*) from public.decision_options where session_id=p_session_id and eligible) <= 1 then raise exception using errcode='23514'; end if;
  update public.decision_options set eligible=p_eligible where id=p_option_id returning * into v_option;
  return pg_catalog.jsonb_build_object('id',v_option.id,'label',v_option.label,'order',v_option.position,'eligible',v_option.eligible);
end; $$;

revoke all on function public.update_option_eligibility_v1(uuid,text,uuid,boolean) from public, anon, authenticated;
grant execute on function public.update_option_eligibility_v1(uuid,text,uuid,boolean) to service_role;
