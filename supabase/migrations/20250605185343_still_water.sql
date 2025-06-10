/*
  # Create Admin User Migration
  
  1. Changes
    - Creates a new admin user if they don't exist
    - Assigns admin role to the user
    
  2. Security
    - Uses secure password hashing
    - Ensures idempotent operations
*/

-- Create the user in auth.users if they don't exist
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- First check if user exists
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = 'larryaubain@gmail.com';

  -- If user doesn't exist, create them
  IF new_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'larryaubain@gmail.com',
      crypt('La072969', gen_salt('bf')),
      now(),
      now(),
      now()
    )
    RETURNING id INTO new_user_id;
  END IF;

  -- Add admin role if not already present
  IF NOT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = new_user_id
  ) THEN
    INSERT INTO admin_users (user_id, role)
    VALUES (new_user_id, 'admin');
  END IF;
END;
$$;