/*
  # Add Initial Admin User
  
  1. Changes
    - Creates initial admin user in auth.users
    - Adds admin role in admin_users table
  
  2. Security
    - Sets up email/password authentication
    - Assigns admin role
*/

-- Create admin user if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'admin@example.com'
    ) THEN
        INSERT INTO auth.users (
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        )
        VALUES (
            'admin@example.com',
            crypt('admin123', gen_salt('bf')),
            now(),
            now(),
            now(),
            encode(gen_random_bytes(32), 'hex'),
            encode(gen_random_bytes(32), 'hex')
        );
    END IF;
END
$$;

-- Add admin role
INSERT INTO admin_users (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@example.com'
AND NOT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.users.id
);