/*
  # Add Custom Admin User

  1. Changes
    - Creates a new admin user in auth.users
    - Adds the user to admin_users table with admin role
    
  2. Security
    - Password will need to be changed after first login
*/

-- Create the user in auth.users
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
VALUES (
  'your-email@example.com',  -- Replace with your email
  crypt('your-password-here', gen_salt('bf')), -- Replace with your password
  now(),
  now(),
  now()
);

-- Add them as an admin
INSERT INTO admin_users (
  user_id,
  role
)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'your-email@example.com'),
  'admin'
);