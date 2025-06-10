-- Check if the user exists in auth.users
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'larryaubain@gmail.com';

-- Check if the user is in admin_users table
SELECT au.id, au.role, au.created_at
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
WHERE u.email = 'larryaubain@gmail.com';