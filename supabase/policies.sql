-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON photos;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON photos;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON photos;
DROP POLICY IF EXISTS "Enable read access for all users" ON blocks;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON blocks;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON blocks;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON blocks;

-- Enable RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Photos policies
CREATE POLICY "Enable read access for all users"
on photos
for select
to public
using (true);

CREATE POLICY "Enable insert for authenticated users"
on photos
for insert
to public
with check (true);

CREATE POLICY "Enable delete for authenticated users"
on photos
for delete
to public
using (true);

-- Blocks policies
CREATE POLICY "Enable read access for all users"
on blocks
for select
to public
using (true);

CREATE POLICY "Enable insert for authenticated users"
on blocks
for insert
to public
with check (true);

CREATE POLICY "Enable update for authenticated users"
on blocks
for update
to public
using (true);

CREATE POLICY "Enable delete for authenticated users"
on blocks
for delete
to public
using (true);
