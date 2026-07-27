begin;
do $$
declare c jsonb; j jsonb; h uuid; g uuid; s uuid; o1 uuid; o2 uuid; room jsonb;
begin
  select public.create_decision_session_v1('Projection','CUSTOM','BEST_FIT','[{"label":"A"},{"label":"B"}]','Host',repeat('d',64),repeat('e',64)) into c;
  s := (c->>'session_id')::uuid; h := (c->>'participant_id')::uuid;
  select public.join_decision_session_v1(repeat('d',64),'Guest',repeat('f',64)) into j; g := (j->>'participant_id')::uuid;
  select id into o1 from public.decision_options where session_id=s and position=0;
  select id into o2 from public.decision_options where session_id=s and position=1;
  perform public.update_participant_readiness_v1(s,repeat('e',64),'READY');
  perform public.update_participant_readiness_v1(s,repeat('f',64),'READY');
  perform public.start_lobby_voting_v1(s,repeat('e',64));
  perform public.submit_private_ballot_v1(s,repeat('e',64),jsonb_build_array(jsonb_build_object('optionId',o1,'value','LOVE'),jsonb_build_object('optionId',o2,'value','PASS')));
  perform public.submit_private_ballot_v1(s,repeat('f',64),jsonb_build_array(jsonb_build_object('optionId',o1,'value','FINE'),jsonb_build_object('optionId',o2,'value','VETO')));
  perform public.finalize_decision_v1(s,repeat('e',64));
  select public.participant_room_v1(s,g) into room;
  assert room->'result'->>'winnerOptionId'=o1::text;
  assert room->'result' ?& array['winnerOptionId','method','explanation','finalizedAt'];
  assert room::text !~ 'LOVE|FINE|PASS|VETO|participant_access_token_hash|invitation_token_hash';
end $$;
rollback;
