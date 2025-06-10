/*
  # Fix Admin User Access

  1. Changes
    - Add admin role for specific user
    - Update RLS policies for admin access
    - Fix ambiguous column references

  2. Security
    - Enable RLS
    - Add policies for admin access
*/

-- Get user ID for dablazer@gmail.com
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'dablazer@gmail.com';

  -- If user exists, ensure they have admin role
  IF v_user_id IS NOT NULL THEN
    -- Remove any existing admin entry to avoid duplicates
    DELETE FROM admin_users WHERE user_id = v_user_id;
    
    -- Insert new admin entry
    INSERT INTO admin_users (user_id, role)
    VALUES (v_user_id, 'admin');
  END IF;
END;
$$;

-- Update RLS policies for better admin access
DROP POLICY IF EXISTS "admins_view_access" ON admin_users;
DROP POLICY IF EXISTS "users_view_own" ON admin_users;

-- Policy for admins to view and manage admin users
CREATE POLICY "admins_full_access" ON admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.role IN ('admin', 'super_admin')
    )
  );

-- Policy for users to view their own admin status
CREATE POLICY "users_view_own" ON admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;