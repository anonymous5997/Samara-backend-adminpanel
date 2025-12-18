/*
  # Fix Profiles RLS SELECT Policy

  1. Changes
    - Drop the existing "Users can view own profile" policy that has a recursive dependency
    - Create a new simple SELECT policy that allows users to read their own profile
    - This fixes the circular dependency where checking admin role required querying profiles

  2. Security
    - Users can only SELECT their own profile (auth.uid() = id)
    - Admin access to other profiles should be handled at the application layer with service role
    - This prevents the deadlock situation where RLS blocks profile fetch after login
*/

-- Drop the existing policy with recursive dependency
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create new simple SELECT policy without recursion
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
