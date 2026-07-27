begin;
do $$
declare c jsonb; j jsonb; s uuid; o1 uuid; o2 uuid; expected uuid; r jsonb; room jsonb;
begin
  select public.create_decision_session_v1('Seed','CUSTOM','BEST_FIT','[{"label":"A"},{"label":"B"}]','Host',repeat('1',64),repeat('2',64)) into c;
  s := (c->>'session_id')::uuid;
  select public.join_decision_session_v1(repeat('1',64),'Guest',repeat('3',64)) into j;
  select id into o1 from public.decision_options where session_id=s and position=0; select id into o2 from public.decision_options where session_id=s and position=1;
  perform public.update_participant_readiness_v1(s,repeat('2',64),'READY'); perform public.update_participant_readiness_v1(s,repeat('3',64),'READY'); perform public.start_lobby_voting_v1(s,repeat('2',64));
  perform public.submit_private_ballot_v1(s,repeat('2',64),jsonb_build_array(jsonb_build_object('optionId',o1,'value','LOVE'),jsonb_build_object('optionId',o2,'value','LOVE')));
  perform public.submit_private_ballot_v1(s,repeat('3',64),jsonb_build_array(jsonb_build_object('optionId',o1,'value','PASS'),jsonb_build_object('optionId',o2,'value','PASS')));
  select o.id into expected from public.decision_options o join public.decision_sessions ds on ds.id=o.session_id where o.session_id=s order by md5(ds.selection_seed::text || o.id::text) limit 1;
  select public.finalize_decision_v1(s,repeat('2',64)) into r;
  assert r->>'winnerOptionId'=expected::text;
  select public.participant_room_v1(s,(j->>'participant_id')::uuid) into room;
  assert room::text !~ 'selection_seed';
end $$;
rollback;
