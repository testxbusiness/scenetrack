-- Funzione per spostare i blocchi quando ne inseriamo uno nuovo
create or replace function shift_blocks(p_sequence_id uuid, p_position int)
returns void
language plpgsql
security definer
as $$
begin
  -- Sposta tutti i blocchi con order_number >= p_position di una posizione in avanti
  update blocks
  set order_number = order_number + 1
  where sequence_id = p_sequence_id
  and order_number >= p_position;
end;
$$;

-- Funzione per riordinare i blocchi dopo un drag and drop
create or replace function reorder_blocks(p_sequence_id uuid, p_blocks json[])
returns void
language plpgsql
security definer
as $$
declare
  block_data json;
begin
  -- Aggiorna l'ordine di ogni blocco
  for block_data in select * from json_array_elements(array_to_json(p_blocks))
  loop
    update blocks
    set order_number = (block_data->>'order_number')::int
    where id = (block_data->>'id')::uuid
    and sequence_id = p_sequence_id;
  end loop;
end;
$$;
