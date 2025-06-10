/*
  # Create API Feeds Table

  1. New Tables
    - `api_feeds`: Stores API feed configurations
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `url` (text, required)
      - `api_key` (text, required)
      - `sport_id` (uuid, foreign key to sports)
      - `is_active` (boolean)
      - `refresh_interval` (integer)
      - `last_fetch` (timestamp)
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for admin access
*/

-- Create API Feeds table
CREATE TABLE IF NOT EXISTS api_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  api_key text NOT NULL,
  sport_id uuid REFERENCES sports(id),
  is_active boolean DEFAULT true,
  refresh_interval integer DEFAULT 300,
  last_fetch timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE api_feeds ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage API feeds"
  ON api_feeds
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.user_id = auth.uid()
  ));

-- Create updated_at trigger
CREATE TRIGGER update_api_feeds_updated_at
  BEFORE UPDATE ON api_feeds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create indexes
CREATE INDEX idx_api_feeds_sport_id ON api_feeds(sport_id);
CREATE INDEX idx_api_feeds_is_active ON api_feeds(is_active);