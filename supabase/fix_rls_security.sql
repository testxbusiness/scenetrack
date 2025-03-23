-- Script per risolvere gli errori di sicurezza RLS in Supabase
-- Questo script abilita Row Level Security (RLS) sulle tabelle cast_members, block_cast e users
-- e crea le policy di sicurezza appropriate per ciascuna tabella

-- 1. Tabella cast_members
-- Abilita RLS sulla tabella cast_members
ALTER TABLE cast_members ENABLE ROW LEVEL SECURITY;

-- Policy per cast_members
CREATE POLICY "Enable read access for authenticated users" ON cast_members
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Enable insert for authenticated users" ON cast_members
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Enable update for authenticated users" ON cast_members
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Enable delete for authenticated users" ON cast_members
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- 2. Tabella block_cast
-- Abilita RLS sulla tabella block_cast
ALTER TABLE block_cast ENABLE ROW LEVEL SECURITY;

-- Policy per block_cast
CREATE POLICY "Enable read access for authenticated users" ON block_cast
  FOR SELECT USING (
    block_id IN (
      SELECT b.id FROM blocks b
      JOIN sequences s ON b.sequence_id = s.id
      JOIN projects p ON s.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Enable insert for authenticated users" ON block_cast
  FOR INSERT WITH CHECK (
    block_id IN (
      SELECT b.id FROM blocks b
      JOIN sequences s ON b.sequence_id = s.id
      JOIN projects p ON s.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Enable update for authenticated users" ON block_cast
  FOR UPDATE USING (
    block_id IN (
      SELECT b.id FROM blocks b
      JOIN sequences s ON b.sequence_id = s.id
      JOIN projects p ON s.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Enable delete for authenticated users" ON block_cast
  FOR DELETE USING (
    block_id IN (
      SELECT b.id FROM blocks b
      JOIN sequences s ON b.sequence_id = s.id
      JOIN projects p ON s.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- 3. Tabella users
-- Abilita RLS sulla tabella users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy per users
-- Nota: Queste policy sono bilanciate per permettere agli utenti di vedere solo i propri dati
-- ma consentire al service_role di gestire tutti gli utenti
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Questa policy è necessaria per consentire al trigger di inserire nuovi utenti
CREATE POLICY "Service role can access all users" ON users
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Questa policy è necessaria per consentire l'inserimento di nuovi utenti tramite il trigger
CREATE POLICY "Allow insert via trigger" ON users
  FOR INSERT WITH CHECK (true);
