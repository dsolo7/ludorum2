/*
  # User Achievement System

  1. New Tables
    - `achievement_definitions` - Defines available achievements
    - `user_achievements` - Tracks user progress toward achievements
  
  2. Functions
    - `check_achievement_progress` - Updates achievement progress and awards badges/XP
    - `get_user_achievements` - Retrieves user achievement data
  
  3. Security
    - Enable RLS on both tables
    - Add policies for user access and admin management
  
  4. Default Data
    - Insert predefined badge definitions if they don't exist
    - Insert default achievement definitions
*/

-- First, ensure required badge definitions exist
INSERT INTO badge_definitions (id, name, description, xp_reward)
VALUES
  ('first_win', 'First Win', 'Earned your first correct prediction', 100),
  ('streak_master', 'Streak Master', 'Maintained a 7-day activity streak', 250),
  ('social_butterfly', 'Social Butterfly', 'Voted on 50 community predictions', 150),
  ('high_roller', 'High Roller', 'Spent 1000 tokens on AI analysis', 300),
  ('contest_champion', 'Contest Champion', 'Won your first prediction contest', 500),
  ('accuracy_ace', 'Accuracy Ace', 'Achieved 80% prediction accuracy over 20 bets', 750)
ON CONFLICT (id) DO NOTHING;

-- Create achievement_definitions table
CREATE TABLE IF NOT EXISTS achievement_definitions (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  target_value integer NOT NULL,
  xp_reward integer NOT NULL DEFAULT 0,
  badge_id text REFERENCES badge_definitions(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL REFERENCES achievement_definitions(id),
  progress integer NOT NULL DEFAULT 0,
  target integer NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable Row Level Security
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for achievement_definitions
CREATE POLICY "Public can view active achievement definitions"
  ON achievement_definitions
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage achievement definitions"
  ON achievement_definitions
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_role_assignments ara
    WHERE ara.user_id = auth.uid()
    AND ara.role_name IN ('super_admin', 'admin')
    AND ara.is_active = true
  ));

-- Create policies for user_achievements
CREATE POLICY "Users can view own achievements"
  ON user_achievements
  FOR SELECT
  TO public
  USING (user_id = auth.uid());

CREATE POLICY "System can insert/update user achievements"
  ON user_achievements
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger for user_achievements
CREATE OR REPLACE FUNCTION update_user_achievements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_achievements_updated_at
BEFORE UPDATE ON user_achievements
FOR EACH ROW
EXECUTE FUNCTION update_user_achievements_updated_at();

-- Create function to check achievement progress
CREATE OR REPLACE FUNCTION check_achievement_progress(
  p_user_id uuid,
  p_achievement_id text,
  p_progress integer
)
RETURNS boolean AS $$
DECLARE
  v_achievement record;
  v_user_achievement record;
  v_badge_id text;
  v_xp_reward integer;
BEGIN
  -- Get achievement definition
  SELECT * INTO v_achievement
  FROM achievement_definitions
  WHERE id = p_achievement_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Achievement not found or inactive';
  END IF;
  
  -- Get or create user achievement record
  SELECT * INTO v_user_achievement
  FROM user_achievements
  WHERE user_id = p_user_id AND achievement_id = p_achievement_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_achievements (
      user_id, 
      achievement_id, 
      progress, 
      target, 
      is_completed
    ) VALUES (
      p_user_id, 
      p_achievement_id, 
      p_progress, 
      v_achievement.target_value, 
      p_progress >= v_achievement.target_value
    )
    RETURNING * INTO v_user_achievement;
  ELSE
    -- Update progress if not already completed
    IF NOT v_user_achievement.is_completed THEN
      UPDATE user_achievements
      SET 
        progress = p_progress,
        is_completed = p_progress >= v_achievement.target_value,
        completed_at = CASE WHEN p_progress >= v_achievement.target_value THEN now() ELSE NULL END
      WHERE id = v_user_achievement.id;
    END IF;
  END IF;
  
  -- If newly completed, award badge and XP
  IF p_progress >= v_achievement.target_value AND NOT v_user_achievement.is_completed THEN
    -- Award badge if defined
    IF v_achievement.badge_id IS NOT NULL THEN
      v_badge_id := v_achievement.badge_id;
      
      -- Check if user already has this badge
      IF NOT EXISTS (
        SELECT 1 FROM user_badges 
        WHERE user_id = p_user_id AND badge_id = v_badge_id
      ) THEN
        -- Award the badge
        INSERT INTO user_badges (user_id, badge_id)
        VALUES (p_user_id, v_badge_id);
      END IF;
    END IF;
    
    -- Award XP
    v_xp_reward := v_achievement.xp_reward;
    
    -- Update user XP
    INSERT INTO user_xp (user_id, xp_points, level)
    VALUES (
      p_user_id, 
      v_xp_reward, 
      FLOOR(v_xp_reward / 1000) + 1
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      xp_points = user_xp.xp_points + v_xp_reward,
      level = FLOOR((user_xp.xp_points + v_xp_reward) / 1000) + 1;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get achievement progress for a user
CREATE OR REPLACE FUNCTION get_user_achievements(p_user_id uuid)
RETURNS TABLE (
  achievement_id text,
  name text,
  description text,
  category text,
  progress integer,
  target integer,
  is_completed boolean,
  completed_at timestamptz,
  xp_reward integer,
  badge_id text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ad.id as achievement_id,
    ad.name,
    ad.description,
    ad.category,
    COALESCE(ua.progress, 0) as progress,
    ad.target_value as target,
    COALESCE(ua.is_completed, false) as is_completed,
    ua.completed_at,
    ad.xp_reward,
    ad.badge_id
  FROM 
    achievement_definitions ad
  LEFT JOIN 
    user_achievements ua ON ad.id = ua.achievement_id AND ua.user_id = p_user_id
  WHERE 
    ad.is_active = true
  ORDER BY 
    ad.category, 
    COALESCE(ua.is_completed, false), 
    ad.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default achievement definitions
INSERT INTO achievement_definitions (id, name, description, category, target_value, xp_reward, badge_id)
VALUES
  ('first_prediction', 'First Steps', 'Make your first prediction', 'Getting Started', 1, 100, 'first_win'),
  ('prediction_master', 'Prediction Master', 'Make 100 predictions', 'Predictions', 100, 500, NULL),
  ('streak_warrior', 'Streak Warrior', 'Maintain a 7-day activity streak', 'Engagement', 7, 250, 'streak_master'),
  ('social_butterfly', 'Social Butterfly', 'Vote on 50 community predictions', 'Social', 50, 200, 'social_butterfly'),
  ('big_spender', 'High Roller', 'Spend 1000 tokens on AI analysis', 'Engagement', 1000, 300, 'high_roller'),
  ('contest_champion', 'Contest Champion', 'Win your first prediction contest', 'Contests', 1, 500, 'contest_champion'),
  ('accuracy_ace', 'Accuracy Ace', 'Achieve 80% prediction accuracy over 20 bets', 'Skill', 80, 750, 'accuracy_ace')
ON CONFLICT (id) DO NOTHING;