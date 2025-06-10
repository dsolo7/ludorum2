/*
  # Page Builder System

  1. New Tables
    - `page_layouts`: Stores page metadata and publishing status
    - `ui_blocks`: Stores individual UI blocks that make up pages

  2. Security
    - Enable RLS on all tables
    - Add policies for admin management and public viewing
    - Create indexes for performance

  3. Sample Data
    - Insert default pages and blocks for demonstration
*/

-- Create page_layouts table
CREATE TABLE IF NOT EXISTS page_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  is_published boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Create ui_blocks table
CREATE TABLE IF NOT EXISTS ui_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES page_layouts(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  block_type text NOT NULL CHECK (block_type IN ('analyzer', 'contest', 'leaderboard', 'ad', 'text', 'custom')),
  content jsonb DEFAULT '{}',
  position integer NOT NULL DEFAULT 0,
  background_color text,
  visibility_rules jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE page_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ui_blocks ENABLE ROW LEVEL SECURITY;

-- Create policies for page_layouts (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'page_layouts' AND policyname = 'Admins can manage page layouts'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can manage page layouts"
      ON page_layouts
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM admin_role_assignments ara
          WHERE ara.user_id = auth.uid()
          AND ara.role_name IN (''super_admin'', ''admin'')
          AND ara.is_active = true
        )
      )';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'page_layouts' AND policyname = 'Public can view published pages'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can view published pages"
      ON page_layouts
      FOR SELECT
      TO public
      USING (is_published = true)';
  END IF;
END;
$$;

-- Create policies for ui_blocks (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ui_blocks' AND policyname = 'Admins can manage UI blocks'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can manage UI blocks"
      ON ui_blocks
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM admin_role_assignments ara
          WHERE ara.user_id = auth.uid()
          AND ara.role_name IN (''super_admin'', ''admin'')
          AND ara.is_active = true
        )
      )';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ui_blocks' AND policyname = 'Public can view blocks for published pages'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can view blocks for published pages"
      ON ui_blocks
      FOR SELECT
      TO public
      USING (
        EXISTS (
          SELECT 1 FROM page_layouts
          WHERE page_layouts.id = ui_blocks.page_id
          AND page_layouts.is_published = true
        )
      )';
  END IF;
END;
$$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_page_layouts_slug ON page_layouts(slug);
CREATE INDEX IF NOT EXISTS idx_page_layouts_is_published ON page_layouts(is_published);
CREATE INDEX IF NOT EXISTS idx_ui_blocks_page_id ON ui_blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_ui_blocks_block_type ON ui_blocks(block_type);
CREATE INDEX IF NOT EXISTS idx_ui_blocks_position ON ui_blocks(position);

-- Create updated_at triggers
DO $$
BEGIN
  -- Create function if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_page_layouts_updated_at'
  ) THEN
    EXECUTE 'CREATE OR REPLACE FUNCTION update_page_layouts_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql';
  END IF;

  -- Create trigger if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_page_layouts_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER update_page_layouts_updated_at
      BEFORE UPDATE ON page_layouts
      FOR EACH ROW
      EXECUTE FUNCTION update_page_layouts_updated_at()';
  END IF;

  -- Create function if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_ui_blocks_updated_at'
  ) THEN
    EXECUTE 'CREATE OR REPLACE FUNCTION update_ui_blocks_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql';
  END IF;

  -- Create trigger if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_ui_blocks_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER update_ui_blocks_updated_at
      BEFORE UPDATE ON ui_blocks
      FOR EACH ROW
      EXECUTE FUNCTION update_ui_blocks_updated_at()';
  END IF;
END;
$$;

-- Insert sample data
INSERT INTO page_layouts (name, slug, description, is_published, metadata)
VALUES 
  ('Home Dashboard', 'dashboard', 'Main user dashboard page', true, '{"icon": "home", "showInNav": true}'),
  ('NFL Analysis', 'nfl', 'NFL-specific analysis page', true, '{"icon": "football", "showInNav": true}'),
  ('My Picks', 'my-picks', 'User picks and predictions', true, '{"icon": "star", "showInNav": true}')
ON CONFLICT (slug) DO NOTHING;

-- Get the page IDs for sample blocks
DO $$
DECLARE
  dashboard_id uuid;
  nfl_id uuid;
  picks_id uuid;
BEGIN
  SELECT id INTO dashboard_id FROM page_layouts WHERE slug = 'dashboard' LIMIT 1;
  SELECT id INTO nfl_id FROM page_layouts WHERE slug = 'nfl' LIMIT 1;
  SELECT id INTO picks_id FROM page_layouts WHERE slug = 'my-picks' LIMIT 1;
  
  -- Insert sample blocks if pages exist
  IF dashboard_id IS NOT NULL THEN
    INSERT INTO ui_blocks (page_id, title, description, block_type, content, position, background_color)
    VALUES 
      (dashboard_id, 'Welcome Banner', 'Welcome message for users', 'text', 
       '{"text": "Welcome to Sports Genius! Get AI-powered insights for your sports bets.", "textSize": "large"}', 
       0, '#f0f9ff'),
      (dashboard_id, 'Quick Analyzer', 'Quick access to analyzer', 'analyzer', 
       '{"analyzer_id": null, "showUploadButton": true}', 
       1, '#ffffff'),
      (dashboard_id, 'Featured Contest', 'Highlighted contest of the day', 'contest', 
       '{"contest_id": null, "showPrizePool": true}', 
       2, '#f8fafc')
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF nfl_id IS NOT NULL THEN
    INSERT INTO ui_blocks (page_id, title, description, block_type, content, position, background_color)
    VALUES 
      (nfl_id, 'NFL Analyzer', 'NFL-specific analyzer', 'analyzer', 
       '{"analyzer_id": null, "sport": "NFL"}', 
       0, '#f0f9ff'),
      (nfl_id, 'NFL Leaderboard', 'Top NFL predictions', 'leaderboard', 
       '{"sport": "NFL", "limit": 10}', 
       1, '#ffffff')
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF picks_id IS NOT NULL THEN
    INSERT INTO ui_blocks (page_id, title, description, block_type, content, position, background_color)
    VALUES 
      (picks_id, 'My Recent Picks', 'User''s recent predictions', 'custom', 
       '{"component": "UserPicks", "limit": 5}', 
       0, '#ffffff'),
      (picks_id, 'Recommended Sportsbook', 'Targeted sportsbook ad', 'ad', 
       '{"campaign_id": null, "placement": "inline"}', 
       1, '#f0f9ff')
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;