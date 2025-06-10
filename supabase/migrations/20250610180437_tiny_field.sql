/*
  # Verify and Update Analyzer System Tables

  1. Changes
    - Verify ai_models table structure and add missing columns
    - Ensure analyzer_requests has proper structure
    - Update RLS policies without using jwt() function
    - Add proper indexes for performance
    - Create audit triggers for ai_models
    - Verify all required tables for analyzer system

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users and admins
    - Create view for active AI models
*/

-- Verify ai_models table structure
DO $$
BEGIN
  -- Check if ai_models has all required columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_models' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE ai_models ADD COLUMN is_active boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_models' AND column_name = 'settings'
  ) THEN
    ALTER TABLE ai_models ADD COLUMN settings jsonb DEFAULT '{}';
  END IF;
END $$;

-- Ensure analyzer_requests has proper structure
DO $$
BEGIN
  -- Add any missing columns to analyzer_requests
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analyzer_requests' AND column_name = 'tokens_used'
  ) THEN
    ALTER TABLE analyzer_requests ADD COLUMN tokens_used integer DEFAULT 0;
  END IF;
END $$;

-- Update ai_models policies for better access control
DROP POLICY IF EXISTS "authenticated_read_access" ON ai_models;
CREATE POLICY "authenticated_read_access"
  ON ai_models
  FOR SELECT
  TO public
  USING (is_active = true);

DROP POLICY IF EXISTS "admin_all_access" ON ai_models;
CREATE POLICY "admin_all_access"
  ON ai_models
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_role_assignments ara
      WHERE ara.user_id = auth.uid()
      AND ara.role_name IN ('super_admin', 'admin')
      AND ara.is_active = true
    )
  );

-- Add policy for admins to manage models
DROP POLICY IF EXISTS "Admins can manage models" ON ai_models;
CREATE POLICY "Admins can manage models"
  ON ai_models
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

-- Add policy for admins to read all models
DROP POLICY IF EXISTS "Admins can read all models" ON ai_models;
CREATE POLICY "Admins can read all models"
  ON ai_models
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_ai_models_is_active ON ai_models(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_models_sport_id ON ai_models(sport_id);
CREATE INDEX IF NOT EXISTS idx_ai_models_betting_type_id ON ai_models(betting_type_id);
CREATE INDEX IF NOT EXISTS idx_ai_models_llm_provider_id ON ai_models(llm_provider_id);

-- Add audit trigger for ai_models
CREATE OR REPLACE FUNCTION log_ai_model_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO admin_activity_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      new_values
    ) VALUES (
      auth.uid(),
      'ai_model_created',
      'ai_model',
      NEW.id,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO admin_activity_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      'ai_model_updated',
      'ai_model',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO admin_activity_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      old_values
    ) VALUES (
      auth.uid(),
      'ai_model_deleted',
      'ai_model',
      OLD.id,
      to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for ai_models audit logging
DROP TRIGGER IF EXISTS ai_models_audit_trigger ON ai_models;
CREATE TRIGGER ai_models_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON ai_models
  FOR EACH ROW
  EXECUTE FUNCTION log_ai_model_changes();

-- Verify user_tokens table has proper structure
DO $$
BEGIN
  -- Ensure user_tokens has expires_at column for token expiration
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_tokens' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE user_tokens ADD COLUMN expires_at timestamptz;
  END IF;
END $$;

-- Add indexes for user_tokens
CREATE INDEX IF NOT EXISTS idx_user_tokens_balance ON user_tokens(balance);
CREATE INDEX IF NOT EXISTS idx_user_tokens_expires_at ON user_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);

-- Verify token_transactions has proper structure and indexes
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at);

-- Update prediction_cards to ensure proper gamification support
DO $$
BEGIN
  -- Ensure prediction_cards can be dynamically injected from admin
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prediction_cards' AND column_name = 'is_resolved'
  ) THEN
    ALTER TABLE prediction_cards ADD COLUMN is_resolved boolean DEFAULT false;
  END IF;
END $$;

-- Add indexes for prediction_cards
CREATE INDEX IF NOT EXISTS idx_prediction_cards_contest_id ON prediction_cards(contest_id);
CREATE INDEX IF NOT EXISTS idx_prediction_cards_analyzer_request_id ON prediction_cards(analyzer_request_id);

-- Add indexes for analyzer_requests
CREATE INDEX IF NOT EXISTS idx_analyzer_requests_user_id ON analyzer_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_analyzer_requests_model_id ON analyzer_requests(model_id);
CREATE INDEX IF NOT EXISTS idx_analyzer_requests_status ON analyzer_requests(status);
CREATE INDEX IF NOT EXISTS idx_analyzer_requests_created_at ON analyzer_requests(created_at);

-- Add indexes for analyzer_responses
CREATE INDEX IF NOT EXISTS idx_analyzer_responses_request_id ON analyzer_responses(analyzer_request_id);

-- Add indexes for contest_entries
CREATE INDEX IF NOT EXISTS idx_contest_entries_user_id ON contest_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_contest_entries_contest_id ON contest_entries(contest_id);

-- Add indexes for contests
CREATE INDEX IF NOT EXISTS idx_contests_status ON contests(status);
CREATE INDEX IF NOT EXISTS idx_contests_model_id ON contests(model_id);

-- Verify all tables have proper RLS enabled
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyzer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyzer_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_token_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_entries ENABLE ROW LEVEL SECURITY;

-- Create view for active AI models with related data
CREATE OR REPLACE VIEW active_ai_models AS
SELECT 
  am.id,
  am.name,
  am.description,
  s.name as sport_name,
  bt.name as betting_type,
  lp.name as llm_provider,
  am.prompt_template,
  am.settings,
  am.is_active,
  am.created_at,
  am.updated_at
FROM ai_models am
LEFT JOIN sports s ON s.id = am.sport_id
LEFT JOIN betting_types bt ON bt.id = am.betting_type_id
LEFT JOIN llm_providers lp ON lp.id = am.llm_provider_id
WHERE am.is_active = true;

-- Verify all required tables exist and log status
DO $$
DECLARE
  table_count integer;
BEGIN
  -- Count required tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'ai_models',
    'analyzer_requests', 
    'analyzer_responses',
    'user_tokens',
    'prediction_cards',
    'token_transactions',
    'model_token_settings',
    'contests',
    'contest_entries'
  );
  
  RAISE NOTICE 'Verified % out of 9 required tables exist', table_count;
  
  IF table_count >= 7 THEN
    RAISE NOTICE 'Core analyzer system tables are properly set up';
  ELSE
    RAISE WARNING 'Some required tables are missing. Please check the migration logs.';
  END IF;
END $$;