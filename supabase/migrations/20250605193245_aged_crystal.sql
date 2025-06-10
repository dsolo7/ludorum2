/*
  # Verify User ID

  Checks if the user exists in auth.users table and retrieves their ID.
*/

SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'dablazer@gmail.com';