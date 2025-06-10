/*
  # Contest Management System

  1. New Tables
    - `contests` - Contest definitions and configuration
    - `contest_entries` - User participation and predictions  
    - `prediction_cards` - Structured prediction questions
    - `social_votes` - Community voting system

  2. Security
    - Enable RLS on all new tables
    - Add policies for secure access control
    - Admin and user-specific permissions

  3. Performance
    - Add indexes for efficient queries
    - Triggers for automatic updates
    - Functions for social statistics

  4. Features
    - Complete contest lifecycle management
    - Token-based entry system
    - Social voting and engagement
    - Prediction tracking and resolution
*/

-- Create contests table
CREATE TABLE IF NOT EXISTS contests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  model_id uuid REFERENCES ai_models(id),
  sport_id uuid REFERENCES sports(id),
  betting_type_id uuid REFERENCES betting_types(id),
  token_cost integer NOT NULL DEFAULT 1,
  prize_pool integer DEFAULT 0,
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'completed')),
  max_entries integer,
  current_entries integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contest_entries table
CREATE TABLE IF NOT EXISTS contest_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid REFERENCES contests(id) ON DELETE CASCADE,
  prediction_card_id uuid REFERENCES prediction_cards(id),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  prediction_value text NOT NULL,
  confidence_level integer CHECK (confidence_level >= 1 AND confidence_level <= 5),
  tokens_spent integer NOT NULL,
  is_correct boolean,
  points_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(contest_id, user_id, prediction_card_id)
);

-- Create prediction_cards table
CREATE TABLE IF NOT EXISTS prediction_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid REFERENCES contests(id) ON DELETE CASCADE,
  analyzer_request_id uuid REFERENCES analyzer_requests(id),
  title text NOT NULL,
  description text,
  prediction_type text NOT NULL CHECK (prediction_type IN ('thumbs_up_down', 'multiple_choice', 'numeric')),
  options jsonb DEFAULT '[]',
  correct_answer text,
  is_resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create social_votes table
CREATE TABLE IF NOT EXISTS social_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  analyzer_request_id uuid REFERENCES analyzer_requests(id),
  prediction_card_id uuid REFERENCES prediction_cards(id),
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, analyzer_request_id, prediction_card_id)
);

-- Enable RLS
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  -- Drop contests policies
  DROP POLICY IF EXISTS "Public can view active contests" ON contests;
  DROP POLICY IF EXISTS "Admins can manage contests" ON contests;
  
  -- Drop contest_entries policies
  DROP POLICY IF EXISTS "Users can view own entries" ON contest_entries;
  DROP POLICY IF EXISTS "Users can create entries" ON contest_entries;
  DROP POLICY IF EXISTS "Admins can view all entries" ON contest_entries;
  
  -- Drop prediction_cards policies
  DROP POLICY IF EXISTS "Public can view prediction cards" ON prediction_cards;
  DROP POLICY IF EXISTS "Admins can manage prediction cards" ON prediction_cards;
  
  -- Drop social_votes policies
  DROP POLICY IF EXISTS "Users can view all social votes" ON social_votes;
  DROP POLICY IF EXISTS "Users can create social votes" ON social_votes;
  DROP POLICY IF EXISTS "Users can update own social votes" ON social_votes;
END $$;

-- Create contests policies
CREATE POLICY "Public can view active contests"
  ON contests
  FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Admins can manage contests"
  ON contests
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

-- Create contest entries policies
CREATE POLICY "Users can view own entries"
  ON contest_entries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create entries"
  ON contest_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all entries"
  ON contest_entries
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

-- Create prediction cards policies
CREATE POLICY "Public can view prediction cards"
  ON prediction_cards
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage prediction cards"
  ON prediction_cards
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

-- Create social votes policies
CREATE POLICY "Users can view all social votes"
  ON social_votes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create social votes"
  ON social_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own social votes"
  ON social_votes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contests_status ON contests(status);
CREATE INDEX IF NOT EXISTS idx_contests_model_id ON contests(model_id);
CREATE INDEX IF NOT EXISTS idx_contest_entries_contest_id ON contest_entries(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_entries_user_id ON contest_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_prediction_cards_contest_id ON prediction_cards(contest_id);
CREATE INDEX IF NOT EXISTS idx_prediction_cards_analyzer_request_id ON prediction_cards(analyzer_request_id);
CREATE INDEX IF NOT EXISTS idx_social_votes_user_id ON social_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_social_votes_analyzer_request_id ON social_votes(analyzer_request_id);
CREATE INDEX IF NOT EXISTS idx_social_votes_prediction_card_id ON social_votes(prediction_card_id);
CREATE INDEX IF NOT EXISTS idx_social_votes_vote_type ON social_votes(vote_type);

-- Create or replace functions and triggers
CREATE OR REPLACE FUNCTION update_contest_entry_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE contests 
    SET current_entries = current_entries + 1 
    WHERE id = NEW.contest_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE contests 
    SET current_entries = current_entries - 1 
    WHERE id = OLD.contest_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS contest_entry_count_trigger ON contest_entries;
CREATE TRIGGER contest_entry_count_trigger
  AFTER INSERT OR DELETE ON contest_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_contest_entry_count();

-- Create or replace social votes update function
CREATE OR REPLACE FUNCTION update_social_votes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_social_votes_updated_at ON social_votes;
CREATE TRIGGER update_social_votes_updated_at
  BEFORE UPDATE ON social_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_social_votes_updated_at();

-- Create or replace function to get social stats
CREATE OR REPLACE FUNCTION get_social_stats(request_id uuid)
RETURNS TABLE (
  total_votes bigint,
  thumbs_up_percentage numeric,
  thumbs_down_percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_votes,
    ROUND(
      (COUNT(*) FILTER (WHERE vote_type = 'up')::numeric / NULLIF(COUNT(*), 0)) * 100, 
      1
    ) as thumbs_up_percentage,
    ROUND(
      (COUNT(*) FILTER (WHERE vote_type = 'down')::numeric / NULLIF(COUNT(*), 0)) * 100, 
      1
    ) as thumbs_down_percentage
  FROM social_votes 
  WHERE analyzer_request_id = request_id;
END;
$$ LANGUAGE plpgsql;

-- Add contests updated_at trigger if update_updated_at_column function exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_contests_updated_at ON contests;
    CREATE TRIGGER update_contests_updated_at
      BEFORE UPDATE ON contests
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;