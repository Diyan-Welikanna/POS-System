-- Fix RLS policies for all tables to allow authenticated users

-- 1. PROFILES TABLE
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;

CREATE POLICY "Enable read for authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. PRODUCTS TABLE
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON products;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON products;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON products;

CREATE POLICY "Enable read for authenticated users"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- 3. CATEGORIES TABLE
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON categories;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON categories;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON categories;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON categories;

CREATE POLICY "Enable read for authenticated users"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON categories FOR DELETE
  TO authenticated
  USING (true);

-- 4. CUSTOMERS TABLE
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON customers;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON customers;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON customers;

CREATE POLICY "Enable read for authenticated users"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON customers FOR DELETE
  TO authenticated
  USING (true);

-- 5. TRANSACTIONS TABLE
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON transactions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON transactions;

CREATE POLICY "Enable read for authenticated users"
  ON transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 6. TRANSACTION_ITEMS TABLE
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON transaction_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON transaction_items;

CREATE POLICY "Enable read for authenticated users"
  ON transaction_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON transaction_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 7. STOCK_MOVEMENTS TABLE
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON stock_movements;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON stock_movements;

CREATE POLICY "Enable read for authenticated users"
  ON stock_movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON products TO authenticated;
GRANT ALL ON categories TO authenticated;
GRANT ALL ON customers TO authenticated;
GRANT ALL ON transactions TO authenticated;
GRANT ALL ON transaction_items TO authenticated;
GRANT ALL ON stock_movements TO authenticated;

-- Verify RLS is enabled
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'products', 'categories', 'customers', 'transactions', 'transaction_items', 'stock_movements')
ORDER BY tablename;
