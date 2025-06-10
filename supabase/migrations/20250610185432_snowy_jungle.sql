/*
  # Ad Placements Management System

  1. New Tables
    - `ad_placements`: Define specific locations where ads can be displayed
    - `ad_placement_assignments`: Link ads to specific placements with priority

  2. Security
    - Enable RLS on all tables
    - Add policies for public viewing and admin management

  3. Functions
    - `get_ads_for_placement()`: Fetch ads for specific placement locations

  4. Sample Data
    - Default ad placements for common locations
    - Sample assignments for testing
*/

-- Create ad_placements table
CREATE TABLE IF NOT EXISTS ad_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  placement_type text NOT NULL CHECK (placement_type IN ('sidebar', 'inline', 'modal', 'banner', 'overlay')),
  max_ads integer DEFAULT 3,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ad_placement_assignments table
CREATE TABLE IF NOT EXISTS ad_placement_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  placement_id uuid NOT NULL REFERENCES ad_placements(id) ON DELETE CASCADE,
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(ad_id, placement_id)
);

-- Enable RLS
ALTER TABLE ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_placement_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for ad_placements
CREATE POLICY "Public can view active placements"
  ON ad_placements
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage placements"
  ON ad_placements
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

-- Policies for ad_placement_assignments
CREATE POLICY "Public can view active assignments"
  ON ad_placement_assignments
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage assignments"
  ON ad_placement_assignments
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
CREATE INDEX idx_ad_placements_name ON ad_placements(name);
CREATE INDEX idx_ad_placements_is_active ON ad_placements(is_active);
CREATE INDEX idx_ad_placement_assignments_placement_id ON ad_placement_assignments(placement_id);
CREATE INDEX idx_ad_placement_assignments_ad_id ON ad_placement_assignments(ad_id);
CREATE INDEX idx_ad_placement_assignments_priority ON ad_placement_assignments(priority);

-- Create updated_at trigger for ad_placements
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE TRIGGER update_ad_placements_updated_at
      BEFORE UPDATE ON ad_placements
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Function to get ads for a specific placement
CREATE OR REPLACE FUNCTION get_ads_for_placement(
  p_placement_name text,
  p_sport_category text DEFAULT NULL,
  p_limit integer DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  image_url text,
  target_url text,
  ad_type text,
  priority integer,
  placement_priority integer
) AS $$
DECLARE
  placement_max_ads integer;
  final_limit integer;
BEGIN
  -- Get the placement details
  SELECT max_ads INTO placement_max_ads
  FROM ad_placements
  WHERE name = p_placement_name AND is_active = true;

  -- Determine the final limit
  final_limit := COALESCE(p_limit, placement_max_ads, 3);

  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.description,
    a.image_url,
    a.target_url,
    a.ad_type,
    a.priority,
    apa.priority as placement_priority
  FROM ads a
  INNER JOIN ad_placement_assignments apa ON a.id = apa.ad_id
  INNER JOIN ad_placements ap ON apa.placement_id = ap.id
  WHERE ap.name = p_placement_name
    AND ap.is_active = true
    AND apa.is_active = true
    AND a.is_active = true
    AND (a.end_date IS NULL OR a.end_date > now())
    AND (p_sport_category IS NULL OR a.sport_category = p_sport_category OR a.sport_category IS NULL)
  ORDER BY apa.priority DESC, a.priority DESC, RANDOM()
  LIMIT final_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default ad placements
INSERT INTO ad_placements (name, display_name, description, placement_type, max_ads) VALUES
  ('dashboard_sidebar', 'Dashboard Sidebar', 'Sidebar ads on the main dashboard', 'sidebar', 2),
  ('analyzer_results_top', 'Analyzer Results Top', 'Banner ad at the top of analyzer results', 'banner', 1),
  ('analyzer_results_bottom', 'Analyzer Results Bottom', 'Inline ads at the bottom of analyzer results', 'inline', 2),
  ('analyzer_results_sidebar', 'Analyzer Results Sidebar', 'Sidebar ads on analyzer results page', 'sidebar', 3),
  ('contest_page_header', 'Contest Page Header', 'Header banner on contest pages', 'banner', 1),
  ('contest_page_sidebar', 'Contest Page Sidebar', 'Sidebar ads on contest pages', 'sidebar', 2),
  ('leaderboard_inline', 'Leaderboard Inline', 'Inline ads within leaderboard content', 'inline', 1),
  ('modal_overlay', 'Modal Overlay', 'Overlay ads in modals', 'overlay', 1),
  ('landing_page_hero', 'Landing Page Hero', 'Hero section ads on landing page', 'banner', 1),
  ('mobile_bottom_banner', 'Mobile Bottom Banner', 'Sticky bottom banner for mobile devices', 'banner', 1)
ON CONFLICT (name) DO NOTHING;

-- Assign some sample ads to placements (only if assignments don't exist)
DO $$
DECLARE
  v_sample_ad_id uuid;
  v_analyzer_placement_id uuid;
  v_dashboard_placement_id uuid;
BEGIN
  -- Get a sample ad
  SELECT id INTO v_sample_ad_id FROM ads LIMIT 1;
  
  IF v_sample_ad_id IS NOT NULL THEN
    -- Get placement IDs
    SELECT id INTO v_analyzer_placement_id FROM ad_placements WHERE name = 'analyzer_results_sidebar';
    SELECT id INTO v_dashboard_placement_id FROM ad_placements WHERE name = 'dashboard_sidebar';
    
    -- Assign to analyzer results sidebar
    IF v_analyzer_placement_id IS NOT NULL THEN
      INSERT INTO ad_placement_assignments (ad_id, placement_id, priority)
      VALUES (v_sample_ad_id, v_analyzer_placement_id, 10)
      ON CONFLICT (ad_id, placement_id) DO NOTHING;
    END IF;
    
    -- Assign to dashboard sidebar
    IF v_dashboard_placement_id IS NOT NULL THEN
      INSERT INTO ad_placement_assignments (ad_id, placement_id, priority)
      VALUES (v_sample_ad_id, v_dashboard_placement_id, 5)
      ON CONFLICT (ad_id, placement_id) DO NOTHING;
    END IF;
  END IF;
END $$;