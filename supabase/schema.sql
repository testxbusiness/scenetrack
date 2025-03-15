-- Crea le tabelle con i vincoli di chiave esterna e indici appropriati

-- Tabella dei progetti
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indice per velocizzare le query sui progetti di un utente
create index if not exists projects_user_id_idx on projects(user_id);

-- Trigger per aggiornare il timestamp updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_projects_updated_at
  before update on projects
  for each row
  execute function update_updated_at_column();

-- Tabella delle sequenze
create table if not exists sequences (
  id uuid default gen_random_uuid() primary key,
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indice per velocizzare le query sulle sequenze di un progetto
create index if not exists sequences_project_id_idx on sequences(project_id);

create trigger update_sequences_updated_at
  before update on sequences
  for each row
  execute function update_updated_at_column();

-- Tabella dei blocchi
create table if not exists blocks (
  id uuid default gen_random_uuid() primary key,
  sequence_id uuid not null references sequences(id) on delete cascade,
  order_number integer not null,
  title text,
  notes text,
  completed boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indici per velocizzare le query sui blocchi
create index if not exists blocks_sequence_id_idx on blocks(sequence_id);
create index if not exists blocks_order_number_idx on blocks(order_number);

create trigger update_blocks_updated_at
  before update on blocks
  for each row
  execute function update_updated_at_column();

-- Tabella delle foto
create table if not exists photos (
  id uuid default gen_random_uuid() primary key,
  block_id uuid not null references blocks(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indice per velocizzare le query sulle foto di un blocco
create index if not exists photos_block_id_idx on photos(block_id);

-- Tabella dei commenti
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  block_id uuid not null references blocks(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indice per velocizzare le query sui commenti di un blocco
create index if not exists comments_block_id_idx on comments(block_id);

-- Funzione per verificare l'ordine dei blocchi
create or replace function check_block_order()
returns trigger as $$
begin
  -- Verifica se il nuovo order_number è già utilizzato nella stessa sequenza
  if exists (
    select 1 from blocks
    where sequence_id = new.sequence_id
    and order_number = new.order_number
    and id != new.id
  ) then
    -- Se esiste già un blocco con questo numero, sposta tutti i blocchi successivi
    update blocks
    set order_number = order_number + 1
    where sequence_id = new.sequence_id
    and order_number >= new.order_number
    and id != new.id;
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger per mantenere l'ordine dei blocchi
create trigger maintain_block_order
  before insert or update on blocks
  for each row
  execute function check_block_order();
