-- Add violations column to trades table
alter table trades add column if not exists violations text[];
