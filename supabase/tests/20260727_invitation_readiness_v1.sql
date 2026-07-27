begin;

do $$
declare v_created jsonb; v_room jsonb; v_session uuid; v_host uuid; v_guest uuid; v_invitation jsonb;
begin
  select public.create_decision_session_v1('Lobby', 'EAT', 'BEST_FIT', '[{"label":"A"},{"label":"B"}]', 'Host', repeat('a',64), repeat('b',64)) into v_created;
  v_session := (v_created->>'session_id')::uuid; v_host := (v_created->>'participant_id')::uuid;
  assert (select expires_at > now() + interval '23 hours' and expires_at <= now() + interval '24 hours 1 minute' from public.session_invitations where session_id=v_session);
  select public.replace_session_invitation_v1(v_session, repeat('b',64), repeat('c',64)) into v_invitation;
  assert v_invitation::text !~ 'aaaaaaaa|bbbbbbbb|cccccccc|token_hash';
  assert (select count(*) from public.session_invitations where session_id=v_session and revoked_at is null and expires_at>now()) = 1;
  begin perform public.replace_session_invitation_v1(v_session, repeat('d',64), repeat('e',64)); raise exception 'expected unauthorized replacement'; exception when insufficient_privilege then null; end;
  select public.join_decision_session_v1(repeat('c',64),'Guest',repeat('d',64)) into v_room; v_guest := (v_room->>'participant_id')::uuid;
  begin perform public.update_participant_readiness_v1(v_session,repeat('e',64),'READY'); raise exception 'expected unauthorized readiness'; exception when insufficient_privilege then null; end;
  perform public.update_participant_readiness_v1(v_session,repeat('b',64),'READY');
  perform public.update_participant_readiness_v1(v_session,repeat('d',64),'READY');
  select public.start_lobby_voting_v1(v_session,repeat('b',64)) into v_room;
  assert v_room #>> '{session,status}' = 'VOTING';
  begin perform public.join_decision_session_v1(repeat('c',64),'Late',repeat('e',64)); raise exception 'expected late join rejection'; exception when object_not_in_prerequisite_state then null; end;
  begin perform public.update_participant_readiness_v1(v_session,repeat('d',64),'WAITING'); raise exception 'expected post-start readiness rejection'; exception when object_not_in_prerequisite_state then null; end;
  begin perform public.revoke_session_invitation_v1(v_session,repeat('b',64)); raise exception 'expected post-start revoke rejection'; exception when object_not_in_prerequisite_state then null; end;
  assert v_room::text !~ 'token_hash|aaaaaaaa|bbbbbbbb|cccccccc|dddddddd';
end $$;

do $$
declare v_session uuid;
begin
  insert into public.decision_sessions(title,category,mode,status) values('Expired','EAT','BEST_FIT','LOBBY') returning id into v_session;
  insert into public.session_participants(session_id,display_name,role,readiness,participant_access_token_hash) values(v_session,'Host','HOST','WAITING',repeat('a',64));
  insert into public.session_invitations(session_id,invitation_token_hash,expires_at) values(v_session,repeat('f',64),now()-interval '1 second');
  begin perform public.join_decision_session_v1(repeat('f',64),'Guest',repeat('b',64)); raise exception 'expected expired rejection'; exception when invalid_parameter_value then null; end;
  perform public.revoke_session_invitation_v1(v_session,repeat('a',64));
  begin perform public.join_decision_session_v1(repeat('f',64),'Guest',repeat('b',64)); raise exception 'expected revoked rejection'; exception when invalid_parameter_value then null; end;
end $$;

do $$
begin
  assert not has_function_privilege('anon','public.replace_session_invitation_v1(uuid,text,text)','execute');
  assert not has_function_privilege('authenticated','public.update_participant_readiness_v1(uuid,text,text)','execute');
  assert has_function_privilege('service_role','public.start_lobby_voting_v1(uuid,text)','execute');
end $$;

rollback;
