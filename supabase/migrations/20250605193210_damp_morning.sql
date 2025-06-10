-- Check if user exists and get their ID
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'dablazer@gmail.com';