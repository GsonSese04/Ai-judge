-- Create a special AI user for AI-generated arguments
-- This user has a special UUID that we use to identify AI-generated content
-- The ON CONFLICT handles the case where this user already exists
insert into users (id, name, email, role)
values (
  '00000000-0000-0000-0000-000000000000',
  'AI Lawyer',
  'ai@aicourt.gh',
  'ai'
)
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  role = excluded.role;

