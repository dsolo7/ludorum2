-- Debug migration to check and fix access issues

-- First, let's check what users exist
DO $$
DECLARE
  user_record RECORD;
BEGIN
  RAISE NOTICE 'Checking existing users in auth.users:';
  FOR user_record IN 
    SELECT id, email, created_at 
    FROM auth.users 
    WHERE email IN ('dablazer@gmail.com', 'larryaubain@gmail.com')
  LOOP
    RAISE NOTICE 'User found: % (ID: %)', user_record.email, user_record.id;
  END LOOP;
END;
$$;

-- Check existing role assignments
DO $$
DECLARE
  assignment_record RECORD;
BEGIN
  RAISE NOTICE 'Checking existing role assignments:';
  FOR assignment_record IN 
    SELECT ara.*, u.email
    FROM admin_role_assignments ara
    JOIN auth.users u ON u.id = ara.user_id
    WHERE ara.is_active = true
  LOOP
    RAISE NOTICE 'Assignment: % has role % (active: %)', 
      assignment_record.email, 
      assignment_record.role_name, 
      assignment_record.is_active;
  END LOOP;
END;
$$;

-- Ensure dablazer@gmail.com has super admin access
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'dablazer@gmail.com';

  IF v_user_id IS NOT NULL THEN
    -- Insert or update super admin assignment using ON CONFLICT
    INSERT INTO admin_role_assignments (
      user_id, 
      role_name, 
      assigned_by, 
      is_active,
      assigned_at
    ) VALUES (
      v_user_id, 
      'super_admin', 
      v_user_id, 
      true,
      now()
    )
    ON CONFLICT (user_id, role_name) 
    DO UPDATE SET 
      is_active = true,
      assigned_by = v_user_id,
      assigned_at = now();

    RAISE NOTICE 'Super admin role assigned/updated for dablazer@gmail.com (ID: %)', v_user_id;
  ELSE
    RAISE NOTICE 'User dablazer@gmail.com not found in auth.users';
  END IF;
END;
$$;

-- Also ensure larryaubain@gmail.com has admin access if they exist
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'larryaubain@gmail.com';

  IF v_user_id IS NOT NULL THEN
    -- Insert or update admin assignment using ON CONFLICT
    INSERT INTO admin_role_assignments (
      user_id, 
      role_name, 
      assigned_by, 
      is_active,
      assigned_at
    ) VALUES (
      v_user_id, 
      'admin', 
      v_user_id, 
      true,
      now()
    )
    ON CONFLICT (user_id, role_name) 
    DO UPDATE SET 
      is_active = true,
      assigned_by = v_user_id,
      assigned_at = now();

    RAISE NOTICE 'Admin role assigned/updated for larryaubain@gmail.com (ID: %)', v_user_id;
  ELSE
    RAISE NOTICE 'User larryaubain@gmail.com not found in auth.users';
  END IF;
END;
$$;

-- Verify the assignments were created
DO $$
DECLARE
  assignment_record RECORD;
BEGIN
  RAISE NOTICE 'Final verification of role assignments:';
  FOR assignment_record IN 
    SELECT ara.*, u.email, ar.display_name, ar.permissions
    FROM admin_role_assignments ara
    JOIN auth.users u ON u.id = ara.user_id
    JOIN admin_roles ar ON ar.role_name = ara.role_name
    WHERE ara.is_active = true
    ORDER BY ara.assigned_at DESC
  LOOP
    RAISE NOTICE 'Active assignment: % has role % (%)', 
      assignment_record.email, 
      assignment_record.role_name,
      assignment_record.display_name;
  END LOOP;
END;
$$;