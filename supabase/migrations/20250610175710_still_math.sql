/*
  # Create Analyzer Requests Table

  1. New Tables
    - `analyzer_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `model_id` (uuid, foreign key to ai_models)
      - `image_url` (text, optional)
      - `input_text` (text, optional)
      - `metadata` (jsonb, for storing additional data)
      - `status` (text, processing status)
      - `result` (jsonb, analysis result)
      - `tokens_used` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for user access
*/

-- Create analyzer requests table
CREATE TABLE IF NOT EXISTS analyzer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  model_id uuid NOT NULL REFERENCES ai_models(id),
  image_url text,
  input_text text,
  metadata jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result jsonb,
  tokens_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE analyzer_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own analyzer requests"
  ON analyzer_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create analyzer requests"
  ON analyzer_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own analyzer requests"
  ON analyzer_requests
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all analyzer requests"
  ON analyzer_requests
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

-- Create indexes
CREATE INDEX idx_analyzer_requests_user_id ON analyzer_requests(user_id);
CREATE INDEX idx_analyzer_requests_model_id ON analyzer_requests(model_id);
CREATE INDEX idx_analyzer_requests_status ON analyzer_requests(status);
CREATE INDEX idx_analyzer_requests_created_at ON analyzer_requests(created_at);

-- Create updated_at trigger
CREATE TRIGGER update_analyzer_requests_updated_at
  BEFORE UPDATE ON analyzer_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();