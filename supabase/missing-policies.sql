-- Politica per permettere l'inserimento di nuovi utenti
CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Politica per permettere a Supabase di gestire gli utenti
CREATE POLICY "Enable insert for authenticated users only" ON users
  FOR INSERT WITH CHECK (true);
