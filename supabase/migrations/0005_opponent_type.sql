-- Add opponent_type to cases table
alter table if exists cases add column if not exists opponent_type text check (opponent_type in ('human', 'ai')) default 'human';

-- Add ai_user_id to track AI opponent user (we'll use a special UUID or null)
alter table if exists cases add column if not exists ai_opponent_role text check (ai_opponent_role in ('A', 'B'));

-- Add index for opponent_type queries
create index if not exists cases_opponent_type_idx on cases(opponent_type);


