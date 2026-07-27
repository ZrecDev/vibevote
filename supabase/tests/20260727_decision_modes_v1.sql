begin;
do $$
declare c jsonb; j jsonb; s uuid; o1 uuid; o2 uuid; r jsonb;
begin
  select public.create_decision_session_v1('Instant','CUSTOM','INSTANT_MATCH','[{"label":"A"},{"label":"B"}]','Host',repeat('1',64),repeat('2',64)) into c;
  s := (c->>'session_id')::uuid;
  select public.join_decision_session_v1(repeat('1',64),'Guest',repeat('3',64)) into j;
  select id into o1 from public.decision_options where session_id=s and position=0; select id into o2 from public.decision_options where session_id=s and position=1;
  perform public.update_participant_readiness_v1(s,repeat('2',64),'READY'); perform public.update_participant_readiness_v1(s,repeat('3',64),'READY'); perform public.start_lobby_voting_v1(s,repeat('2',64));
  perform public.submit_private_ballot_v1(s,repeat('2',64),jsonb_build_array(jsonb_build_object('optionId',o1,'value','LOVE'),jsonb_build_object('optionId',o2,'value','PASS')));
  perform public.submit_private_ballot_v1(s,repeat('3',64),jsonb_build_array(jsonb_build_object('optionId',o1,'value','FINE'),jsonb_build_object('optionId',o2,'value','PASS')));
  select public.finalize_decision_v1(s,repeat('2',64)) into r;
  assert r->>'winnerOptionId'=o1::text and r->>'method'='INSTANT_MATCH';
end $$;
do $$
declare c jsonb; j jsonb; s uuid; o1 uuid; o2 uuid; r jsonb;
begin
  select public.create_decision_session_v1('Best','CUSTOM','BEST_FIT','[{"label":"A"},{"label":"B"}]','Host',repeat('4',64),repeat('5',64)) into c;
  s := (c->>'session_id')::uuid;
  select public.join_decision_session_v1(repeat('4',64),'Guest',repeat('6',64)) into j;
  select id into o1 from public.decision_options where session_id=s and position=0; select id into o2 from public.decision_options where session_id=s and position=1;
  perform public.update_participant_readiness_v1(s,repeat('5',64),'READY'); perform public.update_participant_readiness_v1(s,repeat('6',64),'READY'); perform public.start_lobby_voting_v1(s,repeat('5',64));
  perform public.submit_private_ballot_v1(s,repeat('5',64),jsonb_build_array(jsonb_build_object('optionId',o1,'value','FINE'),jsonb_build_object('optionId',o2,'value','LOVE')));
  perform public.submit_private_ballot_v1(s,repeat('6',64),jsonb_build_array(jsonb_build_object('optionId',o1,'value','FINE'),jsonb_build_object('optionId',o2,'value','PASS')));
  select public.finalize_decision_v1(s,repeat('5',64)) into r;
  assert r->>'winnerOptionId'=o2::text and r->>'method'='BEST_FIT';
end $$;
do $$
declare c jsonb; j jsonb; s uuid; o1 uuid; o2 uuid; expected uuid; r jsonb;
begin
  select public.create_decision_session_v1('Chaos','CUSTOM','CHAOS','[{"label":"A"},{"label":"B"}]','Host',repeat('7',64),repeat('8',64)) into c;
  s := (c->>'session_id')::uuid;
  select public.join_decision_session_v1(repeat('7',64),'Guest',repeat('9',64)) into j;
  select id into o1 from public.decision_options where session_id=s and position=0; select id into o2 from public.decision_options where session_id=s and position=1;
  perform public.update_participant_readiness_v1(s,repeat('8',64),'READY'); perform public.update_participant_readiness_v1(s,repeat('9',64),'READY'); perform public.start_lobby_voting_v1(s,repeat('8',64));
  perform public.submit_private_ballot_v1(s,repeat('8',64),jsonb_build_array(jsonb_build_object('optionId',o1,'value','LOVE'),jsonb_build_object('optionId',o2,'value','FINE')));
  perform public.submit_private_ballot_v1(s,repeat('9',64),jsonb_build_array(jsonb_build_object('optionId',o1,'value','FINE'),jsonb_build_object('optionId',o2,'value','LOVE')));
  select o.id into expected from public.decision_options o join public.decision_sessions ds on ds.id=o.session_id where o.session_id=s order by md5(ds.selection_seed::text || o.id::text) limit 1;
  select public.finalize_decision_v1(s,repeat('8',64)) into r;
  assert r->>'winnerOptionId'=expected::text and r->>'method'='CHAOS';
end $$;
do $$
declare c jsonb; j jsonb; s uuid; o1 uuid; o2 uuid;
begin
  select public.create_decision_session_v1('Veto','CUSTOM','BEST_FIT','[{"label":"A"},{"label":"B"}]','Host',repeat('a',64),repeat('b',64)) into c;
  s := (c->>'session_id')::uuid;
  select public.join_decision_session_v1(repeat('a',64),'Guest',repeat('c',64)) into j;
  select id into o1 from public.decision_options where session_id=s and position=0; select id into o2 from public.decision_options where session_id=s and position=1;
  perform public.update_participant_readiness_v1(s,repeat('b',64),'READY'); perform public.update_participant_readiness_v1(s,repeat('c',64),'READY'); perform public.start_lobby_voting_v1(s,repeat('b',64));
  begin
    perform public.submit_private_ballot_v1(s,repeat('b',64),jsonb_build_array(jsonb_build_object('optionId',o1,'value','VETO'),jsonb_build_object('optionId',o2,'value','VETO')));
    raise exception 'expected multi-veto rejection';
  exception when check_violation then null; end;
end $$;
rollback;
