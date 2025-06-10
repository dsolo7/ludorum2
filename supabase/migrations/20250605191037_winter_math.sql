/*
  # Add Admin User

  1. Changes
    - Add dablazer@gmail.com as an admin user
    - Ensure user exists in auth.users
    - Add entry to admin_users table
*/

DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Get the user ID if they exist
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = 'dablazer@gmail.com';

  -- Add admin role if not already present
  IF NOT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = new_user_id
  ) THEN
    INSERT INTO admin_users (user_id, role)
    VALUES (new_user_id, 'admin');
  END IF;
END;
$$;