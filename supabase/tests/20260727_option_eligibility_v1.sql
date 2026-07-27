begin;
do $$
declare c jsonb; j jsonb; s uuid; o1 uuid; o2 uuid; result jsonb;
begin
  select public.create_decision_session_v1('Constraints','CUSTOM','BEST_FIT','[{"label":"A"},{"label":"B"}]','Host',repeat('d',64),repeat('e',64)) into c;
  s := (c->>'session_id')::uuid;
  select public.join_decision_session_v1(repeat('d',64),'Guest',repeat('f',64)) into j;
  select id into o1 from public.decision_options where session_id=s and position=0; select id into o2 from public.decision_options where session_id=s and position=1;
  select public.update_option_eligibility_v1(s,repeat('e',64),o1,false) into result;
  assert result->>'eligible'='false';
  begin perform public.update_option_eligibility_v1(s,repeat('e',64),o2,false); raise exception 'expected last option rejection'; exception when check_violation then null; end;
  begin perform public.update_option_eligibility_v1(s,repeat('f',64),o1,true); raise exception 'expected guest rejection'; exception when insufficient_privilege then null; end;
  perform public.update_participant_readiness_v1(s,repeat('e',64),'READY'); perform public.update_participant_readiness_v1(s,repeat('f',64),'READY'); perform public.start_lobby_voting_v1(s,repeat('e',64));
  begin perform public.update_option_eligibility_v1(s,repeat('e',64),o1,true); raise exception 'expected state rejection'; exception when object_not_in_prerequisite_state then null; end;
end $$;
do $$ begin
  assert not has_function_privilege('authenticated','public.update_option_eligibility_v1(uuid,text,uuid,boolean)','execute');
  assert has_function_privilege('service_role','public.update_option_eligibility_v1(uuid,text,uuid,boolean)','execute');
end $$;
rollback;
