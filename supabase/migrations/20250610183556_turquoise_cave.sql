-- Create social votes table for community sentiment
CREATE TABLE IF NOT EXISTS social_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  analyzer_request_id uuid REFERENCES analyzer_requests(id),
  prediction_card_id uuid REFERENCES prediction_cards(id),
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, analyzer_request_id, prediction_card_id)
);

-- Enable RLS
ALTER TABLE social_votes ENABLE ROW LEVEL SECURITY;

-- Policies
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

-- Create indexes
CREATE INDEX idx_social_votes_user_id ON social_votes(user_id);
CREATE INDEX idx_social_votes_analyzer_request_id ON social_votes(analyzer_request_id);
CREATE INDEX idx_social_votes_prediction_card_id ON social_votes(prediction_card_id);
CREATE INDEX idx_social_votes_vote_type ON social_votes(vote_type);

-- Create updated_at trigger
CREATE TRIGGER update_social_votes_updated_at
  BEFORE UPDATE ON social_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get social stats for an analyzer request
CREATE OR REPLACE FUNCTION get_social_stats(request_id uuid)
RETURNS TABLE(
  total_votes bigint,
  thumbs_up_count bigint,
  thumbs_down_count bigint,
  thumbs_up_percentage numeric,
  thumbs_down_percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_votes,
    COUNT(*) FILTER (WHERE vote_type = 'up') as thumbs_up_count,
    COUNT(*) FILTER (WHERE vote_type = 'down') as thumbs_down_count,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE vote_type = 'up')::numeric / COUNT(*)::numeric) * 100, 1)
      ELSE 0
    END as thumbs_up_percentage,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE vote_type = 'down')::numeric / COUNT(*)::numeric) * 100, 1)
      ELSE 0
    END as thumbs_down_percentage
  FROM social_votes 
  WHERE analyzer_request_id = request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;