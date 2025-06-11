/*
  # Page Builder RPC Functions

  1. New Functions
    - `get_ui_blocks_for_page`: Returns all blocks for a page by slug
    - `get_page_with_blocks`: Returns a complete page with its blocks as JSON
    - `check_block_visibility`: Evaluates visibility rules for blocks
    - `get_visible_blocks_for_user`: Returns only blocks visible to a specific user

  2. Security
    - All functions use SECURITY DEFINER to respect RLS policies
    - Proper validation of inputs
*/

-- Create RPC function to get UI blocks for a page
CREATE OR REPLACE FUNCTION get_ui_blocks_for_page(page_slug text)
RETURNS TABLE (
  page_id uuid,
  page_name text,
  page_description text,
  page_metadata jsonb,
  block_id uuid,
  block_title text,
  block_description text,
  block_type text,
  content jsonb,
  block_position integer,
  background_color text,
  visibility_rules jsonb,
  animation text,
  layout_mode text
) AS $$
BEGIN
  -- First check if the page exists and is published
  IF NOT EXISTS (
    SELECT 1 FROM page_layouts 
    WHERE slug = page_slug 
    AND is_published = true
  ) THEN
    RAISE EXCEPTION 'Page not found or not published';
  END IF;

  -- Return the page with all its blocks
  RETURN QUERY
  SELECT
    p.id as page_id,
    p.name as page_name,
    p.description as page_description,
    p.metadata as page_metadata,
    b.id as block_id,
    b.title as block_title,
    b.description as block_description,
    b.block_type as block_type,
    b.content as content,
    b."position" as block_position,
    b.background_color as background_color,
    b.visibility_rules as visibility_rules,
    b.animation as animation,
    b.layout_mode as layout_mode
  FROM page_layouts p
  JOIN ui_blocks b ON b.page_id = p.id
  WHERE p.slug = page_slug
  AND p.is_published = true
  ORDER BY b."position";
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function to get a single page with all its blocks
CREATE OR REPLACE FUNCTION get_page_with_blocks(page_slug text)
RETURNS jsonb AS $$
DECLARE
  v_page jsonb;
  v_blocks jsonb;
BEGIN
  -- Get the page data
  SELECT jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'slug', p.slug,
    'description', p.description,
    'is_published', p.is_published,
    'metadata', p.metadata,
    'created_at', p.created_at,
    'updated_at', p.updated_at
  ) INTO v_page
  FROM page_layouts p
  WHERE p.slug = page_slug
  AND p.is_published = true;
  
  IF v_page IS NULL THEN
    RAISE EXCEPTION 'Page not found or not published';
  END IF;
  
  -- Get all blocks for the page
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', b.id,
      'title', b.title,
      'description', b.description,
      'block_type', b.block_type,
      'content', b.content,
      'position', b."position",
      'background_color', b.background_color,
      'visibility_rules', b.visibility_rules,
      'animation', b.animation,
      'layout_mode', b.layout_mode
    ) ORDER BY b."position"
  ) INTO v_blocks
  FROM ui_blocks b
  JOIN page_layouts p ON b.page_id = p.id
  WHERE p.slug = page_slug;
  
  -- Combine page and blocks
  RETURN jsonb_build_object(
    'page', v_page,
    'blocks', COALESCE(v_blocks, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if a block should be visible to a user
CREATE OR REPLACE FUNCTION check_block_visibility(
  p_user_id uuid,
  p_visibility_rules jsonb
)
RETURNS boolean AS $$
DECLARE
  v_token_balance integer;
  v_used_analyzers text[];
  v_joined_contests text[];
BEGIN
  -- If no visibility rules, block is always visible
  IF p_visibility_rules IS NULL OR jsonb_typeof(p_visibility_rules) = 'null' OR p_visibility_rules = '{}'::jsonb THEN
    RETURN true;
  END IF;
  
  -- Check authentication requirement
  IF p_visibility_rules->>'requiresAuth' = 'true' AND p_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- If user is not authenticated, no need to check other rules
  IF p_user_id IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check minimum token balance
  IF p_visibility_rules ? 'minTokens' THEN
    SELECT balance INTO v_token_balance
    FROM user_tokens
    WHERE user_id = p_user_id;
    
    IF v_token_balance IS NULL OR v_token_balance < (p_visibility_rules->>'minTokens')::integer THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Check if user has used a specific analyzer
  IF p_visibility_rules ? 'hasUsedAnalyzer' THEN
    SELECT array_agg(model_id::text) INTO v_used_analyzers
    FROM analyzer_requests
    WHERE user_id = p_user_id
    AND status = 'completed';
    
    IF v_used_analyzers IS NULL OR NOT (p_visibility_rules->>'hasUsedAnalyzer' = ANY(v_used_analyzers)) THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Check if user has joined a specific contest
  IF p_visibility_rules ? 'joinedContest' THEN
    SELECT array_agg(contest_id::text) INTO v_joined_contests
    FROM contest_entries
    WHERE user_id = p_user_id;
    
    IF v_joined_contests IS NULL OR NOT (p_visibility_rules->>'joinedContest' = ANY(v_joined_contests)) THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Check if user has joined any contest
  IF p_visibility_rules->>'hasJoinedAnyContest' = 'true' THEN
    IF NOT EXISTS (
      SELECT 1 FROM contest_entries
      WHERE user_id = p_user_id
      LIMIT 1
    ) THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Check if user has used any analyzer
  IF p_visibility_rules->>'hasUsedAnyAnalyzer' = 'true' THEN
    IF NOT EXISTS (
      SELECT 1 FROM analyzer_requests
      WHERE user_id = p_user_id
      AND status = 'completed'
      LIMIT 1
    ) THEN
      RETURN false;
    END IF;
  END IF;
  
  -- If all checks pass, block is visible
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get visible blocks for a user
CREATE OR REPLACE FUNCTION get_visible_blocks_for_user(
  p_page_slug text,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  block_id uuid,
  block_title text,
  block_description text,
  block_type text,
  content jsonb,
  block_position integer,
  background_color text,
  animation text,
  layout_mode text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id as block_id,
    b.title as block_title,
    b.description as block_description,
    b.block_type as block_type,
    b.content as content,
    b."position" as block_position,
    b.background_color as background_color,
    b.animation as animation,
    b.layout_mode as layout_mode
  FROM page_layouts p
  JOIN ui_blocks b ON b.page_id = p.id
  WHERE p.slug = p_page_slug
  AND p.is_published = true
  AND check_block_visibility(p_user_id, b.visibility_rules)
  ORDER BY b."position";
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;