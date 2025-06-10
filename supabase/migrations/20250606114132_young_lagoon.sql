/*
  # Add API Feed to AI Models

  1. Changes
    - Add api_feed_id column to ai_models table
    - Create foreign key relationship to api_feeds table
    - Update indexes for better performance

  2. Security
    - Maintains existing RLS policies
*/

-- Add api_feed_id column to ai_models table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_models' AND column_name = 'api_feed_id'
  ) THEN
    ALTER TABLE ai_models ADD COLUMN api_feed_id uuid REFERENCES api_feeds(id);
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_ai_models_api_feed_id ON ai_models(api_feed_id);