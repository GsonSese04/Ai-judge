-- Extend cases with summary and case_type
alter table if exists cases add column if not exists summary text;
alter table if exists cases add column if not exists case_type text check (case_type in ('Civil','Criminal'));

-- Scenarios table
create table if not exists scenarios (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  difficulty text,
  law_type text,
  sample_evidence jsonb,
  created_at timestamp default now()
);

-- Leaderboard table
create table if not exists leaderboard (
  id uuid primary key default gen_random_uuid(),
  lawyer_id uuid not null,
  lawyer_name text,
  score integer default 0,
  wins integer default 0,
  losses integer default 0,
  updated_at timestamp default now()
);
create index if not exists leaderboard_lawyer_id_idx on leaderboard(lawyer_id);

-- Case results (store verdict + mapping of Lawyer A/B to users)
create table if not exists case_results (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  a_user_id uuid,
  b_user_id uuid,
  winner text,
  score_a integer,
  score_b integer,
  result jsonb,
  created_at timestamp default now()
);

-- (optional) participants mapping if needed in the future
create table if not exists case_participants (
  case_id uuid references cases(id) on delete cascade,
  user_id uuid not null,
  role text check (role in ('A','B')),
  primary key (case_id, role)
);

alter publication supabase_realtime add table scenarios, leaderboard, case_results, case_participants;

