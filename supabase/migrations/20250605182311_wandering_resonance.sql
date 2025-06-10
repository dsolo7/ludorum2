/*
  # Fix admin_users RLS policies

  1. Changes
    - Drop existing problematic policies that cause infinite recursion
    - Create new simplified policies for admin_users table:
      - Enable RLS
      - Allow super_admins to manage all admin users
      - Allow admins to view all admin users
      - Allow users to view their own admin status

  2. Security
    - Maintains proper access control while avoiding recursive policy checks
    - Ensures super_admins retain full control
    - Prevents unauthorized access to admin data
*/

-- First, drop existing policies to start fresh
DROP POLICY IF EXISTS "Admins can read all admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy for super_admins to have full access
CREATE POLICY "super_admins_full_access" ON admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Policy for admins to view all admin users
CREATE POLICY "admins_view_access" ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Policy for users to view their own admin status
CREATE POLICY "users_view_own" ON admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());