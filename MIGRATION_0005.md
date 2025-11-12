# Migration 0005: Add AI Opponent Support

This migration adds support for AI opponents in cases.

## SQL Migration

```sql
-- Add opponent_type to cases table
alter table if exists cases add column if not exists opponent_type text check (opponent_type in ('human', 'ai')) default 'human';

-- Add ai_user_id to track AI opponent user (we'll use a special UUID or null)
alter table if exists cases add column if not exists ai_opponent_role text check (ai_opponent_role in ('A', 'B'));

-- Add index for opponent_type queries
create index if not exists cases_opponent_type_idx on cases(opponent_type);
```

## How to Run

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **"New query"**
5. Copy and paste the SQL above
6. Click **"Run"** (or press `Cmd/Ctrl + Enter`)

### Option 2: Using npm script

Run the migration display script:
```bash
npm run migration:0005
```

This will show you the SQL to copy and paste into the Supabase SQL Editor.

### Option 3: Using Supabase CLI (if linked)

If you have Supabase CLI linked to your project:
```bash
supabase db push
```

Or execute the SQL file directly:
```bash
supabase db execute --file supabase/migrations/0005_opponent_type.sql
```

## What This Migration Does

1. **Adds `opponent_type` column** to the `cases` table
   - Type: `text` with constraint `('human', 'ai')`
   - Default: `'human'` (maintains backward compatibility)
   - Tracks whether the case has a human or AI opponent

2. **Adds `ai_opponent_role` column** to the `cases` table
   - Type: `text` with constraint `('A', 'B')`
   - Tracks which role the AI opponent plays (Lawyer A or Lawyer B)

3. **Creates an index** on `opponent_type` for faster queries

## Verification

After running the migration, verify it worked:

```sql
-- Check that columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'cases' 
  AND column_name IN ('opponent_type', 'ai_opponent_role');

-- Check that index was created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'cases' 
  AND indexname = 'cases_opponent_type_idx';
```

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- Drop the index
DROP INDEX IF EXISTS cases_opponent_type_idx;

-- Drop the columns
ALTER TABLE cases DROP COLUMN IF EXISTS ai_opponent_role;
ALTER TABLE cases DROP COLUMN IF EXISTS opponent_type;
```

## Notes

- This migration is **safe to run** on existing databases
- Uses `IF NOT EXISTS` and `IF EXISTS` clauses to prevent errors
- Default value ensures existing cases remain as 'human' opponents
- The migration is idempotent (can be run multiple times safely)


