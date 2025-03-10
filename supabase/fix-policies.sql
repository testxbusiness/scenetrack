-- Rimuovi le politiche esistenti
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;

-- Aggiungi nuove politiche più permissive
CREATE POLICY "Enable read access for all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for users based on email" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable delete for users based on email" ON users
    FOR DELETE USING (auth.uid() = id);
