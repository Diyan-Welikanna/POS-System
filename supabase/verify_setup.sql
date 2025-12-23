-- Verify database setup and show any issues

-- 1. Check if all required tables exist
SELECT 'CHECKING TABLES' as status;
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('profiles', 'products', 'categories', 'customers', 'transactions', 'transaction_items', 'stock_movements') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'products', 'categories', 'customers', 'transactions', 'transaction_items', 'stock_movements')
ORDER BY table_name;

-- 2. Check RLS status
SELECT 'CHECKING RLS (Row Level Security)' as status;
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✅ ENABLED' 
    ELSE '⚠️ DISABLED' 
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'products', 'categories', 'customers', 'transactions', 'transaction_items', 'stock_movements')
ORDER BY tablename;

-- 3. Check RLS policies
SELECT 'CHECKING RLS POLICIES' as status;
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Check if trigger exists for profile creation
SELECT 'CHECKING TRIGGERS' as status;
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  OR (trigger_schema = 'auth' AND trigger_name LIKE '%user%')
ORDER BY event_object_table, trigger_name;

-- 5. Check profile table structure
SELECT 'CHECKING PROFILES TABLE STRUCTURE' as status;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 6. Check if any profiles exist
SELECT 'CHECKING EXISTING PROFILES' as status;
SELECT 
  id,
  email,
  role,
  full_name,
  created_at
FROM profiles
LIMIT 10;
