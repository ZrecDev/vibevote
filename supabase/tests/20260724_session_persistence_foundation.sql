-- Run after applying the migration in local Supabase. These assertions require a transaction-local service owner.
begin;
do $$ declare session_id uuid; begin
  insert into public.decision_sessions (title, category, mode, status) values ('Dinner', 'CUSTOM', 'BEST_FIT', 'LOBBY') returning id into session_id;
  insert into public.decision_options (session_id, label, position) values (session_id, 'One', 0), (session_id, 'Two', 1);
  perform public.assert_session_option_count(session_id);
  insert into public.session_participants (session_id, display_name, role, readiness) values (session_id, 'Host', 'HOST', 'READY');
  insert into public.session_participants (session_id, display_name, role, readiness, guest_access_token_hash) values (session_id, 'Guest', 'GUEST', 'WAITING', 'guest-hash');
  insert into public.session_invitations (session_id, invitation_token_hash) values (session_id, 'invite-hash');
end $$;
rollback;
