-- Add new columns to blocks table for scene information
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS scene_number TEXT;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS interior_exterior TEXT;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS time_of_day TEXT;

-- Update the types to include the new fields
CREATE TYPE scene_info AS (
  scene_number TEXT,
  location TEXT,
  interior_exterior TEXT,
  time_of_day TEXT
);

-- Function to create multiple scenes at once
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
      time_of_day
    ) VALUES (
      p_sequence_id,
      i,
      scene.scene_number,
      scene.location,
      scene.interior_exterior,
      scene.time_of_day
    );
    i := i + 1;
  END LOOP;
END;
$$;
