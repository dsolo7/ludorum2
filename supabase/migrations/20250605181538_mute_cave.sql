/*
  # Admin Dashboard Schema

  1. New Tables
    - `ai_models`: Model configurations and versions
    - `model_versions`: Version history for AI models
    - `model_logs`: Usage and performance tracking
    - `admin_users`: Admin user management
    - `admin_audit_logs`: Track admin actions
    - `notifications`: System notifications

  2. Security
    - Enable RLS on all tables
    - Add policies for admin access
*/

-- Create enum for admin roles
DO $$ BEGIN
    CREATE TYPE admin_role AS ENUM ('super_admin', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for model status
DO $$ BEGIN
    CREATE TYPE model_status AS ENUM ('draft', 'active', 'inactive', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for betting types
DO $$ BEGIN
    CREATE TYPE betting_type AS ENUM (
      'moneyline',
      'spread',
      'over_under',
      'player_props',
      'parlay',
      'fantasy_lineup'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for sports
DO $$ BEGIN
    CREATE TYPE sport_type AS ENUM (
      'NFL',
      'NBA',
      'MLB',
      'NHL',
      'Soccer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  role admin_role NOT NULL DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI Models table
CREATE TABLE IF NOT EXISTS ai_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  sport sport_type NOT NULL,
  betting_type betting_type NOT NULL,
  status model_status DEFAULT 'draft',
  prompt_template text NOT NULL,
  model_settings jsonb DEFAULT '{}',
  created_by uuid REFERENCES admin_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  version integer DEFAULT 1,
  UNIQUE(name, version)
);

-- Model versions table
CREATE TABLE IF NOT EXISTS model_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES ai_models(id),
  version integer NOT NULL,
  prompt_template text NOT NULL,
  model_settings jsonb DEFAULT '{}',
  created_by uuid REFERENCES admin_users(id),
  created_at timestamptz DEFAULT now(),
  status model_status DEFAULT 'draft',
  changes_description text,
  UNIQUE(model_id, version)
);

-- Model usage logs
CREATE TABLE IF NOT EXISTS model_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES ai_models(id),
  user_id uuid REFERENCES auth.users(id),
  request_data jsonb,
  response_data jsonb,
  processing_time interval,
  created_at timestamptz DEFAULT now()
);

-- Admin audit logs
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES admin_users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  changes jsonb,
  created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  read boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can read all admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.user_id = auth.uid()
  ));

CREATE POLICY "Super admins can manage admin users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.user_id = auth.uid()
    AND au.role = 'super_admin'
  ));

CREATE POLICY "Admins can read all models"
  ON ai_models
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage models"
  ON ai_models
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.user_id = auth.uid()
  ));

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DO $$ BEGIN
    DROP TRIGGER IF EXISTS update_ai_models_updated_at ON ai_models;
    CREATE TRIGGER update_ai_models_updated_at
      BEFORE UPDATE ON ai_models
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
    CREATE TRIGGER update_admin_users_updated_at
      BEFORE UPDATE ON admin_users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
EXCEPTION
    WHEN others THEN null;
END $$;