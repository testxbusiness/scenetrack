-- Tabella dei membri del cast
create table if not exists cast_members (
  id uuid default gen_random_uuid() primary key,
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indice per velocizzare le query sui membri del cast di un progetto
create index if not exists cast_members_project_id_idx on cast_members(project_id);

-- Tabella di relazione tra blocchi e membri del cast
create table if not exists block_cast (
  id uuid default gen_random_uuid() primary key,
  block_id uuid not null references blocks(id) on delete cascade,
  cast_member_id uuid not null references cast_members(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(block_id, cast_member_id)
);

-- Indici per velocizzare le query
create index if not exists block_cast_block_id_idx on block_cast(block_id);
create index if not exists block_cast_cast_member_id_idx on block_cast(cast_member_id);
