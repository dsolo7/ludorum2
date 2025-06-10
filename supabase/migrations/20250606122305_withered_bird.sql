/*
  # Add Super Admin User

  1. Changes
    - Add dablazer@gmail.com as a super admin user
    - Ensure user exists in admin_role_assignments table
    - Log the admin assignment activity

  2. Security
    - Uses the new admin role system
    - Assigns super_admin role with full permissions
*/

-- Add super admin role for dablazer@gmail.com
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'dablazer@gmail.com';

  -- If user exists, ensure they have super admin role
  IF v_user_id IS NOT NULL THEN
    -- Remove any existing role assignments to avoid conflicts
    UPDATE admin_role_assignments 
    SET is_active = false 
    WHERE user_id = v_user_id;
    
    -- Insert new super admin assignment
    INSERT INTO admin_role_assignments (user_id, role_name, assigned_by, is_active)
    VALUES (v_user_id, 'super_admin', v_user_id, true)
    ON CONFLICT (user_id, role_name) DO UPDATE SET
      is_active = true,
      assigned_at = now(),
      assigned_by = v_user_id;

    -- Log the activity
    INSERT INTO admin_activity_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      new_values
    ) VALUES (
      v_user_id,
      'super_admin_assigned',
      'admin_role_assignment',
      v_user_id,
      jsonb_build_object('role_name', 'super_admin', 'user_email', 'dablazer@gmail.com')
    );

    RAISE NOTICE 'Super admin role assigned to dablazer@gmail.com';
  ELSE
    RAISE NOTICE 'User dablazer@gmail.com not found in auth.users';
  END IF;
END;
$$;