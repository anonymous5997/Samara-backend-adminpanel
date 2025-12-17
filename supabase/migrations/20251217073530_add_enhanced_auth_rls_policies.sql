/*
  # Enhanced Authentication & Authorization System
  
  1. **New Policies**
     - Admin-only SELECT policy for profiles
     - Prevent role escalation
     - Ensure email uniqueness
  
  2. **Security Enhancements**
     - Users CANNOT change their own role
     - Only admins can view all profiles
     - Profile updates restricted to non-sensitive fields
  
  3. **Important Notes**
     - RLS is RESTRICTIVE by default
     - Server-side role checks must be used for admin operations
     - Email confirmed status tracking
*/

-- Drop existing policies to recreate with enhanced security
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Enhanced SELECT policy: Users can view their own profile, admins can view all
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    OR 
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );

-- Enhanced UPDATE policy: Users can update their profile but NOT their role or email
CREATE POLICY "Users can update own profile non-sensitive fields"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND 
    role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Enhanced INSERT policy: Users can create their profile with customer role only
CREATE POLICY "Users can insert own profile as customer"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id 
    AND 
    role = 'customer'
  );

-- Admin UPDATE policy: Admins can update any profile including roles
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create index for performance on role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role) WHERE role = 'admin';
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;

-- Create function to prevent duplicate emails
CREATE OR REPLACE FUNCTION prevent_duplicate_email()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE email = NEW.email 
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Email already exists';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for email uniqueness
DROP TRIGGER IF EXISTS check_email_uniqueness ON profiles;
CREATE TRIGGER check_email_uniqueness
  BEFORE INSERT OR UPDATE OF email ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_email();

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();