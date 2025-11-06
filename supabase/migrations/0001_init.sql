create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key,
  name text,
  role text default 'lawyer',
  email text unique,
  created_at timestamp default now()
);

create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  title text,
  status text default 'in_progress',
  current_stage text default 'opening_statement',
  created_by uuid references users(id),
  created_at timestamp default now()
);

create table if not exists arguments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  user_id uuid references users(id),
  stage text,
  transcript text,
  audio_url text,
  created_at timestamp default now()
);

create table if not exists verdicts (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  result jsonb,
  created_at timestamp default now()
);

-- Simple realtime: enable replication
alter publication supabase_realtime add table cases, arguments, verdicts;


