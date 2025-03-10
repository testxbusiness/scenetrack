-- Aggiungi nuovi campi alla tabella blocks
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS history TEXT;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS scene_date DATE;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS scene_time TIME;

-- Aggiorna il tipo scene_info per includere i nuovi campi
DROP TYPE IF EXISTS scene_info CASCADE;
CREATE TYPE scene_info AS (
  scene_number TEXT,
  location TEXT,
  interior_exterior TEXT,
  time_of_day TEXT,
  history TEXT,
  scene_date DATE,
  scene_time TIME
);

-- Aggiorna la funzione create_scenes per supportare i nuovi campi
CREATE OR REPLACE FUNCTION create_scenes(
  p_sequence_id UUID,
  p_scenes scene_info[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  scene scene_info;
  i INTEGER := 1;
BEGIN
  FOREACH scene IN ARRAY p_scenes
  LOOP
    INSERT INTO blocks (
      sequence_id,
      order_number,
      scene_number,
      location,
      interior_exterior,
      time_of_day,
      history,
      scene_date,
      scene_time
    ) VALUES (
      p_sequence_id,
      i,
      scene.scene_number,
      scene.location,
      scene.interior_exterior,
      scene.time_of_day,
      scene.history,
      scene.scene_date,
      scene.scene_time
    );
    i := i + 1;
  END LOOP;
END;
$$;
