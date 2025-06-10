/*
  # Admin Management System

  1. New Tables
    - `admin_roles`: Role definitions with permissions
    - `admin_role_assignments`: User role assignments
    - `admin_activity_logs`: Activity tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
    - Migrate existing admin_users data

  3. Functions
    - Activity logging function
    - Updated timestamp triggers
*/

-- Create admin role types
DO $$ BEGIN
    CREATE TYPE admin_role_type AS ENUM ('super_admin', 'admin', 'content_creator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Admin roles definition table
CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name admin_role_type NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  permissions jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Admin role assignments
CREATE TABLE IF NOT EXISTS admin_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_name admin_role_type NOT NULL,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(user_id, role_name)
);

-- Admin activity logs
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies for admin_roles
CREATE POLICY "Anyone can read admin roles" 
  ON admin_roles 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Super admins can manage roles" 
  ON admin_roles 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM admin_role_assignments ara
      WHERE ara.user_id = auth.uid()
      AND ara.role_name = 'super_admin'
      AND ara.is_active = true
    )
  );

-- Policies for admin_role_assignments
CREATE POLICY "Users can view own assignments" 
  ON admin_role_assignments 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all assignments" 
  ON admin_role_assignments 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM admin_role_assignments ara
      WHERE ara.user_id = auth.uid()
      AND ara.role_name IN ('super_admin', 'admin')
      AND ara.is_active = true
    )
  );

CREATE POLICY "Super admins can manage all assignments" 
  ON admin_role_assignments 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM admin_role_assignments ara
      WHERE ara.user_id = auth.uid()
      AND ara.role_name = 'super_admin'
      AND ara.is_active = true
    )
  );

CREATE POLICY "Admins can manage content creator assignments" 
  ON admin_role_assignments 
  FOR ALL 
  TO authenticated 
  USING (
    role_name = 'content_creator' AND
    EXISTS (
      SELECT 1 FROM admin_role_assignments ara
      WHERE ara.user_id = auth.uid()
      AND ara.role_name IN ('super_admin', 'admin')
      AND ara.is_active = true
    )
  );

-- Policies for admin_activity_logs
CREATE POLICY "Admins can view activity logs" 
  ON admin_activity_logs 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM admin_role_assignments ara
      WHERE ara.user_id = auth.uid()
      AND ara.role_name IN ('super_admin', 'admin')
      AND ara.is_active = true
    )
  );

CREATE POLICY "System can insert activity logs" 
  ON admin_activity_logs 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Insert default roles
INSERT INTO admin_roles (role_name, display_name, description, permissions) VALUES
  ('super_admin', 'Super Admin', 'Full access to all system features', '{
    "dashboard": true,
    "users": true,
    "subscriptions": true,
    "models": true,
    "llm_providers": true,
    "bet_types": true,
    "sports": true,
    "api_feeds": true,
    "leaderboard": true,
    "campaigns": true,
    "analyzer": true,
    "content": true,
    "gamification": true,
    "ads": true,
    "export": true,
    "audit_logs": true,
    "notifications": true,
    "analytics": true,
    "support": true,
    "settings": true,
    "admin_management": true
  }'),
  ('admin', 'Admin', 'Limited admin access without user management and settings', '{
    "dashboard": true,
    "users": false,
    "subscriptions": false,
    "models": true,
    "llm_providers": true,
    "bet_types": true,
    "sports": true,
    "api_feeds": true,
    "leaderboard": true,
    "campaigns": true,
    "analyzer": true,
    "content": true,
    "gamification": true,
    "ads": true,
    "export": false,
    "audit_logs": true,
    "notifications": true,
    "analytics": true,
    "support": true,
    "settings": false,
    "admin_management": false
  }'),
  ('content_creator', 'Content Creator', 'Access to content management only', '{
    "dashboard": false,
    "users": false,
    "subscriptions": false,
    "models": false,
    "llm_providers": false,
    "bet_types": false,
    "sports": false,
    "api_feeds": false,
    "leaderboard": false,
    "campaigns": false,
    "analyzer": false,
    "content": true,
    "gamification": false,
    "ads": false,
    "export": false,
    "audit_logs": false,
    "notifications": false,
    "analytics": false,
    "support": false,
    "settings": false,
    "admin_management": false
  }')
ON CONFLICT (role_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  updated_at = now();

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_roles_updated_at
  BEFORE UPDATE ON admin_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to log admin activities
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_action text,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO admin_activity_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migrate existing admin_users to new system
DO $$
DECLARE
  admin_record RECORD;
  new_role_name admin_role_type;
BEGIN
  FOR admin_record IN 
    SELECT user_id, role FROM admin_users 
  LOOP
    -- Convert the old role to new role type using string comparison
    CASE admin_record.role::text
      WHEN 'super_admin' THEN new_role_name := 'super_admin';
      WHEN 'admin' THEN new_role_name := 'admin';
      ELSE new_role_name := 'admin'; -- Default fallback
    END CASE;
    
    INSERT INTO admin_role_assignments (user_id, role_name, assigned_by)
    VALUES (
      admin_record.user_id,
      new_role_name,
      admin_record.user_id
    )
    ON CONFLICT (user_id, role_name) DO NOTHING;
  END LOOP;
END;
$$;