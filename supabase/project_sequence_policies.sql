-- Abilita RLS sulle tabelle
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;

-- Rimuovi le policy esistenti se presenti
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON projects;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON sequences;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON sequences;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON sequences;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON sequences;

-- Policy per la tabella projects
CREATE POLICY "Enable read access for authenticated users" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for authenticated users" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for authenticated users" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Policy per la tabella sequences
CREATE POLICY "Enable read access for authenticated users" ON sequences
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Enable insert for authenticated users" ON sequences
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Enable update for authenticated users" ON sequences
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Enable delete for authenticated users" ON sequences
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );
