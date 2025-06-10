/*
  # Page Builder Enhancements

  1. Changes
    - Add animation and layout_mode columns to ui_blocks table
    - Add analytics tracking tables for pages and blocks
    - Add storage support for uploaded images
    - Add version tracking for page layouts

  2. Security
    - Maintain RLS policies
    - Add policies for analytics data
*/

-- Add new columns to ui_blocks table
ALTER TABLE ui_blocks ADD COLUMN IF NOT EXISTS animation text;
ALTER TABLE ui_blocks ADD COLUMN IF NOT EXISTS layout_mode text DEFAULT 'standard';

-- Create page_analytics table
CREATE TABLE IF NOT EXISTS page_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES page_layouts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  view_date date NOT NULL DEFAULT CURRENT_DATE,
  view_count integer NOT NULL DEFAULT 1,
  device_type text,
  time_on_page integer, -- in seconds
  created_at timestamptz DEFAULT now()
);

-- Create block_analytics table
CREATE TABLE IF NOT EXISTS block_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid REFERENCES ui_blocks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  interaction_type text NOT NULL, -- view, click, etc.
  interaction_date date NOT NULL DEFAULT CURRENT_DATE,
  interaction_count integer NOT NULL DEFAULT 1,
  tokens_spent integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create page_versions table for version tracking
CREATE TABLE IF NOT EXISTS page_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES page_layouts(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  snapshot jsonb NOT NULL, -- Full page and blocks snapshot
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(page_id, version_number)
);

-- Create page_assets table for uploaded images
CREATE TABLE IF NOT EXISTS page_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES page_layouts(id) ON DELETE CASCADE,
  asset_type text NOT NULL, -- image, icon, etc.
  file_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  file_size integer,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE page_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_assets ENABLE ROW LEVEL SECURITY;

-- Create policies for page_analytics
CREATE POLICY "Admins can view all page analytics"
  ON page_analytics
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

CREATE POLICY "System can insert page analytics"
  ON page_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for block_analytics
CREATE POLICY "Admins can view all block analytics"
  ON block_analytics
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

CREATE POLICY "System can insert block analytics"
  ON block_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for page_versions
CREATE POLICY "Admins can manage page versions"
  ON page_versions
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

-- Create policies for page_assets
CREATE POLICY "Admins can manage page assets"
  ON page_assets
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

CREATE POLICY "Public can view page assets"
  ON page_assets
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM page_layouts
      WHERE page_layouts.id = page_assets.page_id
      AND page_layouts.is_published = true
    )
  );

-- Create storage bucket for page assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('page-assets', 'page-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload page assets
CREATE POLICY "Admins can upload page assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'page-assets' AND
    EXISTS (
      SELECT 1 FROM admin_role_assignments ara
      WHERE ara.user_id = auth.uid()
      AND ara.role_name IN ('super_admin', 'admin')
      AND ara.is_active = true
    )
  );

-- Create policy to allow public access to page assets
CREATE POLICY "Public can view page assets"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'page-assets'
  );

-- Create function to track page views
CREATE OR REPLACE FUNCTION track_page_view(
  p_page_id uuid,
  p_user_id uuid,
  p_device_type text DEFAULT NULL,
  p_time_on_page integer DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Check if there's an entry for this user and page today
  UPDATE page_analytics
  SET view_count = view_count + 1,
      time_on_page = COALESCE(p_time_on_page, time_on_page)
  WHERE page_id = p_page_id
    AND user_id = p_user_id
    AND view_date = CURRENT_DATE;
    
  -- If no rows were updated, insert a new record
  IF NOT FOUND THEN
    INSERT INTO page_analytics (
      page_id,
      user_id,
      view_date,
      view_count,
      device_type,
      time_on_page
    ) VALUES (
      p_page_id,
      p_user_id,
      CURRENT_DATE,
      1,
      p_device_type,
      p_time_on_page
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to track block interactions
CREATE OR REPLACE FUNCTION track_block_interaction(
  p_block_id uuid,
  p_user_id uuid,
  p_interaction_type text,
  p_tokens_spent integer DEFAULT 0
)
RETURNS void AS $$
BEGIN
  -- Check if there's an entry for this user and block today
  UPDATE block_analytics
  SET interaction_count = interaction_count + 1,
      tokens_spent = tokens_spent + p_tokens_spent
  WHERE block_id = p_block_id
    AND user_id = p_user_id
    AND interaction_type = p_interaction_type
    AND interaction_date = CURRENT_DATE;
    
  -- If no rows were updated, insert a new record
  IF NOT FOUND THEN
    INSERT INTO block_analytics (
      block_id,
      user_id,
      interaction_type,
      interaction_date,
      interaction_count,
      tokens_spent
    ) VALUES (
      p_block_id,
      p_user_id,
      p_interaction_type,
      CURRENT_DATE,
      1,
      p_tokens_spent
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to save page version
CREATE OR REPLACE FUNCTION save_page_version(
  p_page_id uuid
)
RETURNS integer AS $$
DECLARE
  v_next_version integer;
  v_page_data jsonb;
  v_blocks_data jsonb;
BEGIN
  -- Get the next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_version
  FROM page_versions
  WHERE page_id = p_page_id;
  
  -- Get page data
  SELECT to_jsonb(p) INTO v_page_data
  FROM page_layouts p
  WHERE id = p_page_id;
  
  -- Get blocks data
  SELECT jsonb_agg(to_jsonb(b)) INTO v_blocks_data
  FROM ui_blocks b
  WHERE page_id = p_page_id
  ORDER BY position;
  
  -- Create the snapshot
  INSERT INTO page_versions (
    page_id,
    version_number,
    snapshot,
    created_by
  ) VALUES (
    p_page_id,
    v_next_version,
    jsonb_build_object(
      'page', v_page_data,
      'blocks', COALESCE(v_blocks_data, '[]'::jsonb)
    ),
    auth.uid()
  );
  
  RETURN v_next_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to restore page version
CREATE OR REPLACE FUNCTION restore_page_version(
  p_page_id uuid,
  p_version_number integer
)
RETURNS boolean AS $$
DECLARE
  v_snapshot jsonb;
  v_page jsonb;
  v_blocks jsonb;
  v_block jsonb;
BEGIN
  -- Get the snapshot
  SELECT snapshot INTO v_snapshot
  FROM page_versions
  WHERE page_id = p_page_id AND version_number = p_version_number;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Extract page and blocks data
  v_page := v_snapshot->'page';
  v_blocks := v_snapshot->'blocks';
  
  -- Update the page
  UPDATE page_layouts
  SET 
    name = v_page->>'name',
    description = v_page->>'description',
    is_published = (v_page->>'is_published')::boolean,
    metadata = v_page->'metadata',
    updated_at = now()
  WHERE id = p_page_id;
  
  -- Delete existing blocks
  DELETE FROM ui_blocks WHERE page_id = p_page_id;
  
  -- Insert blocks from snapshot
  FOR v_block IN SELECT * FROM jsonb_array_elements(v_blocks)
  LOOP
    INSERT INTO ui_blocks (
      page_id,
      title,
      description,
      block_type,
      content,
      position,
      background_color,
      visibility_rules,
      animation,
      layout_mode
    ) VALUES (
      p_page_id,
      v_block->>'title',
      v_block->>'description',
      v_block->>'block_type',
      v_block->'content',
      (v_block->>'position')::integer,
      v_block->>'background_color',
      v_block->'visibility_rules',
      v_block->>'animation',
      COALESCE(v_block->>'layout_mode', 'standard')
    );
  END LOOP;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for analytics tables
CREATE INDEX IF NOT EXISTS idx_page_analytics_page_id ON page_analytics(page_id);
CREATE INDEX IF NOT EXISTS idx_page_analytics_user_id ON page_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_page_analytics_view_date ON page_analytics(view_date);

CREATE INDEX IF NOT EXISTS idx_block_analytics_block_id ON block_analytics(block_id);
CREATE INDEX IF NOT EXISTS idx_block_analytics_user_id ON block_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_block_analytics_interaction_date ON block_analytics(interaction_date);
CREATE INDEX IF NOT EXISTS idx_block_analytics_interaction_type ON block_analytics(interaction_type);

CREATE INDEX IF NOT EXISTS idx_page_versions_page_id ON page_versions(page_id);
CREATE INDEX IF NOT EXISTS idx_page_versions_version_number ON page_versions(version_number);

CREATE INDEX IF NOT EXISTS idx_page_assets_page_id ON page_assets(page_id);
CREATE INDEX IF NOT EXISTS idx_page_assets_asset_type ON page_assets(asset_type);