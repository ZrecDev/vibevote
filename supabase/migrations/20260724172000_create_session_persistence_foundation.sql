-- Secure persistence foundation. Client roles are deny-by-default until server operations exist.
create table public.decision_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  category text not null check (category in ('EAT', 'DO', 'WATCH', 'CUSTOM')),
  mode text not null check (mode in ('INSTANT_MATCH', 'BEST_FIT', 'CHAOS')),
  status text not null check (status in ('DRAFT', 'LOBBY', 'VOTING', 'TIEBREAK', 'DECIDED', 'COMPLETED', 'EXPIRED', 'CANCELLED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.decision_options (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.decision_sessions(id) on delete cascade,
  label text not null check (char_length(btrim(label)) between 1 and 160),
  position integer not null check (position >= 0),
  eligible boolean not null default true,
  created_at timestamptz not null default now(),
  unique (session_id, position)
);

create table public.session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.decision_sessions(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 60),
  role text not null check (role in ('HOST', 'GUEST')),
  readiness text not null check (readiness in ('WAITING', 'READY')),
  guest_access_token_hash text,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((role = 'HOST' and guest_access_token_hash is null) or (role = 'GUEST' and char_length(guest_access_token_hash) > 0))
);

create unique index session_participants_one_host_per_session on public.session_participants (session_id) where role = 'HOST';
create index decision_options_session_id_position_idx on public.decision_options (session_id, position);
create index session_participants_session_id_idx on public.session_participants (session_id);

create table public.session_invitations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.decision_sessions(id) on delete cascade,
  invitation_token_hash text not null unique check (char_length(invitation_token_hash) > 0),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index session_invitations_session_id_idx on public.session_invitations (session_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger decision_sessions_set_updated_at before update on public.decision_sessions for each row execute function public.set_updated_at();
create trigger session_participants_set_updated_at before update on public.session_participants for each row execute function public.set_updated_at();

-- Server create/update transactions must call this before committing a usable room.
create or replace function public.assert_session_option_count(target_session_id uuid)
returns void language plpgsql stable as $$
declare option_count integer;
begin
  select count(*) into option_count from public.decision_options where session_id = target_session_id;
  if option_count < 2 or option_count > 12 then
    raise exception 'session must have between 2 and 12 options' using errcode = '23514';
  end if;
end; $$;

alter table public.decision_sessions enable row level security;
alter table public.decision_options enable row level security;
alter table public.session_participants enable row level security;
alter table public.session_invitations enable row level security;
revoke all on public.decision_sessions, public.decision_options, public.session_participants, public.session_invitations from anon, authenticated;
revoke execute on function public.assert_session_option_count(uuid) from public, anon, authenticated;
