-- Add violations column to trades table
alter table trades add column if not exists violations text[];

-- Add violations column to user_preferences (custom user-defined violations)
alter table user_preferences add column if not exists violations jsonb not null default '[]'::jsonb;
