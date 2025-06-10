/*
  # Ensure Admin Access Migration
  
  1. Changes
    - Adds unique constraint to admin_users.user_id
    - Updates RLS policies for admin_users table
    - Ensures dablazer@gmail.com has admin access
  
  2. Security
    - Enables RLS on admin_users table
    - Adds policies for admin access and user viewing
*/

-- Add unique constraint to user_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'admin_users_user_id_key'
    ) THEN
        ALTER TABLE admin_users ADD CONSTRAINT admin_users_user_id_key UNIQUE (user_id);
    END IF;
END
$$;

-- Ensure dablazer@gmail.com has admin access
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
        -- Remove any existing admin entry for this user
        DELETE FROM admin_users WHERE user_id = v_user_id;
        
        -- Insert new admin entry
        INSERT INTO admin_users (user_id, role)
        VALUES (v_user_id, 'admin');
    END IF;
END
$$;

-- Update RLS policies
DROP POLICY IF EXISTS "admins_full_access" ON admin_users;
DROP POLICY IF EXISTS "super_admins_full_access" ON admin_users;
DROP POLICY IF EXISTS "users_view_own" ON admin_users;

-- Policy for admins to have full access
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