-- Create comments table for blocks
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  block_id uuid not null references blocks(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for faster queries on comments for a block
create index if not exists comments_block_id_idx on comments(block_id);