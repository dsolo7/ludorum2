/*
  # Affiliate Ads System

  1. New Tables
    - `ads`: Store affiliate ad campaigns with targeting
    - `ad_impressions`: Track ad views for analytics
    - `ad_clicks`: Track ad clicks for conversion tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for public viewing and admin management
    - Allow anonymous tracking for impressions and clicks

  3. Functions
    - `get_targeted_ads`: Fetch relevant ads based on targeting criteria
*/

-- Ads table for storing affiliate ad campaigns
CREATE TABLE IF NOT EXISTS ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  text_content text,
  target_url text NOT NULL,
  sport_category text,
  ad_type text NOT NULL CHECK (ad_type IN ('banner', 'sponsored', 'promo')),
  is_active boolean DEFAULT true,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ad impressions tracking
CREATE TABLE IF NOT EXISTS ad_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES ads(id),
  user_id uuid REFERENCES auth.users(id),
  page_url text NOT NULL,
  sport_category text,
  device_type text,
  viewed_at timestamptz DEFAULT now()
);

-- Ad clicks tracking
CREATE TABLE IF NOT EXISTS ad_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES ads(id),
  user_id uuid REFERENCES auth.users(id),
  clicked_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_clicks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public can view active ads" ON ads;
DROP POLICY IF EXISTS "Admins can manage ads" ON ads;
DROP POLICY IF EXISTS "Allow anonymous impression tracking" ON ad_impressions;
DROP POLICY IF EXISTS "Users can view own impressions" ON ad_impressions;
DROP POLICY IF EXISTS "Allow click tracking" ON ad_clicks;
DROP POLICY IF EXISTS "Users can view own clicks" ON ad_clicks;

-- Policies for ads
CREATE POLICY "Public can view active ads"
  ON ads
  FOR SELECT
  TO public
  USING (is_active AND (end_date IS NULL OR end_date > now()));

CREATE POLICY "Admins can manage ads"
  ON ads
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM admin_role_assignments ara
      WHERE ara.user_id = auth.uid()
      AND ara.role_name IN ('super_admin', 'admin')
      AND ara.is_active = true
    )
  );

-- Policies for ad_impressions
CREATE POLICY "Allow anonymous impression tracking"
  ON ad_impressions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can view own impressions"
  ON ad_impressions
  FOR SELECT
  TO public
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM admin_role_assignments ara
      WHERE ara.user_id = auth.uid()
      AND ara.role_name IN ('super_admin', 'admin')
      AND ara.is_active = true
    )
  );

-- Policies for ad_clicks
CREATE POLICY "Allow click tracking"
  ON ad_clicks
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can view own clicks"
  ON ad_clicks
  FOR SELECT
  TO public
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM admin_role_assignments ara
      WHERE ara.user_id = auth.uid()
      AND ara.role_name IN ('super_admin', 'admin')
      AND ara.is_active = true
    )
  );

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS ads_is_active_idx ON ads(is_active);
CREATE INDEX IF NOT EXISTS ads_sport_category_idx ON ads(sport_category);
CREATE INDEX IF NOT EXISTS impressions_ad_id_idx ON ad_impressions(ad_id);
CREATE INDEX IF NOT EXISTS clicks_ad_id_idx ON ad_clicks(ad_id);

-- Create updated_at trigger for ads if update_updated_at_column function exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_ads_updated_at ON ads;
    CREATE TRIGGER update_ads_updated_at
      BEFORE UPDATE ON ads
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Function to get targeted ads
CREATE OR REPLACE FUNCTION get_targeted_ads(
  p_sport_category text DEFAULT NULL,
  p_ad_type text DEFAULT NULL,
  p_limit integer DEFAULT 3
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  image_url text,
  target_url text,
  ad_type text,
  priority integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.description,
    a.image_url,
    a.target_url,
    a.ad_type,
    a.priority
  FROM ads a
  WHERE a.is_active = true
    AND (a.end_date IS NULL OR a.end_date > now())
    AND (p_sport_category IS NULL OR a.sport_category = p_sport_category OR a.sport_category IS NULL)
    AND (p_ad_type IS NULL OR a.ad_type = p_ad_type)
  ORDER BY a.priority DESC, RANDOM()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample ads only if the table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ads LIMIT 1) THEN
    INSERT INTO ads (title, description, image_url, target_url, sport_category, ad_type, priority) VALUES
      (
        'DraftKings Sportsbook - Get $200 Bonus!',
        'Sign up today and get $200 in bonus bets when you bet $5. New users only.',
        'https://images.pexels.com/photos/3621104/pexels-photo-3621104.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://draftkings.com',
        'NFL',
        'sponsored',
        10
      ),
      (
        'FanDuel - No Sweat First Bet up to $1000',
        'Place your first bet and if it loses, get your money back in bonus bets up to $1000.',
        'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://fanduel.com',
        'NBA',
        'sponsored',
        9
      ),
      (
        'BetMGM - Risk-Free Bet up to $1500',
        'Get your first bet back if it doesn''t win. Up to $1500 in bonus bets for new customers.',
        'https://images.pexels.com/photos/1111597/pexels-photo-1111597.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://betmgm.com',
        NULL,
        'banner',
        8
      ),
      (
        'Caesars Sportsbook - First Bet on Caesar',
        'Get up to $1000 back if your first bet doesn''t win. Terms and conditions apply.',
        'https://images.pexels.com/photos/3621104/pexels-photo-3621104.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://caesars.com',
        'MLB',
        'promo',
        7
      ),
      (
        'PointsBet - 2 Risk-Free Bets up to $2000',
        'New users get two risk-free bets up to $1000 each. Double your chances to win!',
        'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://pointsbet.com',
        'NHL',
        'sponsored',
        6
      );
  END IF;
END $$;