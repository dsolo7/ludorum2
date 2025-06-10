/*
  # Create Contests and Prediction Cards Tables

  1. New Tables
    - `contests`: Prediction contests linked to analyzer results
    - `prediction_cards`: Individual prediction entries
    - `contest_entries`: User entries in contests
    - `analyzer_responses`: Separate table for detailed AI responses

  2. Security
    - Enable RLS on all tables
    - Add policies for user access and admin management
*/

-- Contests table for gamification
CREATE TABLE IF NOT EXISTS contests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  model_id uuid REFERENCES ai_models(id),
  sport_id uuid REFERENCES sports(id),
  betting_type_id uuid REFERENCES betting_types(id),
  token_cost integer NOT NULL DEFAULT 1,
  prize_pool integer DEFAULT 0,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'completed')),
  max_entries integer,
  current_entries integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Prediction cards for individual predictions
CREATE TABLE IF NOT EXISTS prediction_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid REFERENCES contests(id),
  analyzer_request_id uuid REFERENCES analyzer_requests(id),
  title text NOT NULL,
  description text,
  prediction_type text NOT NULL CHECK (prediction_type IN ('thumbs_up_down', 'multiple_choice', 'numeric')),
  options jsonb DEFAULT '[]',
  correct_answer text,
  is_resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Contest entries for user participation
CREATE TABLE IF NOT EXISTS contest_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid REFERENCES contests(id),
  prediction_card_id uuid REFERENCES prediction_cards(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  prediction_value text NOT NULL,
  confidence_level integer CHECK (confidence_level BETWEEN 1 AND 5),
  tokens_spent integer NOT NULL,
  is_correct boolean,
  points_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(contest_id, user_id, prediction_card_id)
);

-- Analyzer responses for detailed AI output
CREATE TABLE IF NOT EXISTS analyzer_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analyzer_request_id uuid NOT NULL REFERENCES analyzer_requests(id),
  response_text text NOT NULL,
  confidence_score decimal(3,2),
  risk_assessment text,
  value_rating integer CHECK (value_rating BETWEEN 1 AND 5),
  recommendations jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyzer_responses ENABLE ROW LEVEL SECURITY;

-- Policies for contests
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

-- Policies for prediction_cards
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

-- Policies for contest_entries
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

-- Policies for analyzer_responses
CREATE POLICY "Users can view responses for own requests"
  ON analyzer_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM analyzer_requests ar
      WHERE ar.id = analyzer_request_id
      AND ar.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all responses"
  ON analyzer_responses
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

-- Create indexes
CREATE INDEX idx_contests_model_id ON contests(model_id);
CREATE INDEX idx_contests_status ON contests(status);
CREATE INDEX idx_prediction_cards_contest_id ON prediction_cards(contest_id);
CREATE INDEX idx_prediction_cards_analyzer_request_id ON prediction_cards(analyzer_request_id);
CREATE INDEX idx_contest_entries_contest_id ON contest_entries(contest_id);
CREATE INDEX idx_contest_entries_user_id ON contest_entries(user_id);
CREATE INDEX idx_analyzer_responses_request_id ON analyzer_responses(analyzer_request_id);

-- Create updated_at triggers
CREATE TRIGGER update_contests_updated_at
  BEFORE UPDATE ON contests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample contests
INSERT INTO contests (title, description, token_cost, prize_pool, status) VALUES
  ('NFL Week 1 Predictions', 'Predict the outcomes of Week 1 NFL games', 5, 1000, 'active'),
  ('NBA Player Props Challenge', 'Predict player performance metrics', 3, 500, 'active'),
  ('MLB Home Run Derby', 'Predict which players will hit home runs', 2, 250, 'active');