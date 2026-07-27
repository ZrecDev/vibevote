begin;
do $$
declare c jsonb; j jsonb; h uuid; g uuid; s uuid; o1 uuid; o2 uuid; p jsonb; r jsonb;
begin
  select public.create_decision_session_v1('Vote','CUSTOM','BEST_FIT','[{"label":"A"},{"label":"B"}]','Host',repeat('a',64),repeat('b',64)) into c;
  s := (c->>'session_id')::uuid; h := (c->>'participant_id')::uuid;
  select public.join_decision_session_v1(repeat('a',64),'Guest',repeat('c',64)) into j; g := (j->>'participant_id')::uuid;
  select id into o1 from public.decision_options where session_id=s and position=0; select id into o2 from public.decision_options where session_id=s and position=1;
  perform public.update_participant_readiness_v1(s,repeat('b',64),'READY'); perform public.update_participant_readiness_v1(s,repeat('c',64),'READY'); perform public.start_lobby_voting_v1(s,repeat('b',64));
  select public.submit_private_ballot_v1(s,repeat('b',64),jsonb_build_array(jsonb_build_object('optionId',o1,'value','LOVE'),jsonb_build_object('optionId',o2,'value','PASS'))) into p;
  assert p->>'finishedParticipantCount'='1' and p::text !~ 'LOVE|PASS|optionId';
  select public.submit_private_ballot_v1(s,repeat('c',64),jsonb_build_array(jsonb_build_object('optionId',o1,'value','FINE'),jsonb_build_object('optionId',o2,'value','VETO'))) into p;
  assert p->>'finishedParticipantCount'='2';
  select public.finalize_decision_v1(s,repeat('b',64)) into r;
  assert r->>'winnerOptionId'=o1::text and r::text !~ 'LOVE|FINE|VETO|PASS';
  assert (select status from public.decision_sessions where id=s)='DECIDED';
  assert public.finalize_decision_v1(s,repeat('b',64))=r;
  begin perform public.submit_private_ballot_v1(s,repeat('c',64),jsonb_build_array(jsonb_build_object('optionId',o1,'value','LOVE'),jsonb_build_object('optionId',o2,'value','PASS'))); raise exception 'expected state rejection'; exception when object_not_in_prerequisite_state then null; end;
end $$;
do $$ begin
  assert not has_table_privilege('anon','public.private_ballots','select,insert,update,delete');
  assert not has_table_privilege('authenticated','public.session_results','select,insert,update,delete');
  assert not has_function_privilege('authenticated','public.submit_private_ballot_v1(uuid,text,jsonb)','execute');
  assert has_function_privilege('service_role','public.finalize_decision_v1(uuid,text)','execute');
end $$;
rollback;
