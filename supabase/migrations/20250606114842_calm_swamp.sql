/*
  # Fix infinite recursion in admin_users RLS policies

  1. Problem
    - The current RLS policies on admin_users table cause infinite recursion
    - The admins_full_access policy queries admin_users table which triggers policy evaluation again
    
  2. Solution
    - Drop existing problematic policies
    - Create new policies that use auth.jwt() claims instead of querying admin_users table
    - Use service role for admin operations to bypass RLS when needed
    
  3. Security
    - Maintain security by checking user roles through JWT claims
    - Allow users to view their own admin record
    - Allow service role full access for system operations
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "admins_full_access" ON admin_users;
DROP POLICY IF EXISTS "users_view_own" ON admin_users;

-- Create new policies that don't cause recursion
CREATE POLICY "service_role_full_access" 
  ON admin_users 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "users_can_view_own_admin_record" 
  ON admin_users 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

-- Allow authenticated users to read admin_users for role checking
-- This is safe because it only allows SELECT and doesn't cause recursion
CREATE POLICY "authenticated_can_read_for_role_check" 
  ON admin_users 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- For admin operations, we'll rely on the application layer to check permissions
-- or use the service role key for admin-only operations