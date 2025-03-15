-- Add scene_name column to blocks table
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS scene_name TEXT;

-- Update the scene_info type to include scene_name
DROP TYPE IF EXISTS scene_info CASCADE;
CREATE TYPE scene_info AS (
  scene_number TEXT,
  location TEXT,
  interior_exterior TEXT,
  time_of_day TEXT,
  history TEXT,
  scene_date DATE,
  scene_time TIME,
  scene_name TEXT
);

-- Update the create_scenes function to support scene_name
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
      scene_time,
      scene_name
    ) VALUES (
      p_sequence_id,
      i,
      scene.scene_number,
      scene.location,
      scene.interior_exterior,
      scene.time_of_day,
      scene.history,
      scene.scene_date,
      scene.scene_time,
      scene.scene_name
    );
    i := i + 1;
  END LOOP;
END;
$$;