-- Fix infinite recursion in profiles RLS policies

-- STEP 1: Drop all existing policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;

-- STEP 2: Temporarily disable RLS to test
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- STEP 3: Re-enable RLS with simpler, non-recursive policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create simple policies that don't cause recursion
-- Allow authenticated users to read all profiles (no recursion)
CREATE POLICY "Allow authenticated users to read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to insert their own profile (checking against the NEW row, not existing data)
CREATE POLICY "Allow authenticated users to insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Allow authenticated users to update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- STEP 5: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

-- STEP 6: Verify the fix
SELECT 
  'Profiles RLS Status' as check_type,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;
