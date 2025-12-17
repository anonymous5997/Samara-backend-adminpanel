/*
  # Create Admin User Profile

  1. Creates a function to set user as admin
  2. Admin user must first sign up via the application
  3. Then run: SELECT make_user_admin('blystaiteam@gmail.com');
  
  Note: This migration creates the helper function.
  The actual admin promotion happens after user signs up.
*/

-- Create function to promote user to admin
CREATE OR REPLACE FUNCTION make_user_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Get user ID from auth.users
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  -- Update or create profile with admin role
  INSERT INTO profiles (id, email, name, role, created_at)
  VALUES (
    user_id,
    user_email,
    'Admin User',
    'admin',
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';

  RAISE NOTICE 'User % promoted to admin', user_email;
END;
$$;
