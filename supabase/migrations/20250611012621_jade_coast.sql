/*
  # Page Builder Helper Functions
  
  1. Changes
    - Create functions to fetch UI blocks for dynamic page rendering
    - Drop existing functions first to avoid return type conflicts
    - Add security definer to ensure proper access control
    
  2. Functions
    - get_ui_blocks_for_page: Basic function returning essential block data
    - get_ui_blocks_for_page_full: Comprehensive function with all block fields
    - get_page_with_blocks_by_slug: Function that returns both page metadata and blocks
*/

-- Drop existing functions first to avoid return type conflicts
DROP FUNCTION IF EXISTS get_ui_blocks_for_page(text);
DROP FUNCTION IF EXISTS get_ui_blocks_for_page_full(text);
DROP FUNCTION IF EXISTS get_page_with_blocks_by_slug(text);

-- Create basic function for fetching UI blocks
CREATE OR REPLACE FUNCTION get_ui_blocks_for_page(page_slug text)
RETURNS TABLE (
  id uuid,
  block_type text,
  block_data jsonb,
  visibility_rule jsonb,
  sort_order int
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    b.id,
    b.block_type,
    b.content AS block_data,
    b.visibility_rules AS visibility_rule,
    b."position" AS sort_order
  FROM ui_blocks b
  INNER JOIN page_layouts p ON b.page_id = p.id
  WHERE p.slug = page_slug
  AND p.is_published = true
  ORDER BY b."position"
$$;

-- Create a more comprehensive version that includes all block data
CREATE OR REPLACE FUNCTION get_ui_blocks_for_page_full(page_slug text)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  block_type text,
  content jsonb,
  "position" int,
  background_color text,
  visibility_rules jsonb,
  animation text,
  layout_mode text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    b.id,
    b.title,
    b.description,
    b.block_type,
    b.content,
    b."position",
    b.background_color,
    b.visibility_rules,
    b.animation,
    b.layout_mode
  FROM ui_blocks b
  INNER JOIN page_layouts p ON b.page_id = p.id
  WHERE p.slug = page_slug
  AND p.is_published = true
  ORDER BY b."position"
$$;

-- Create a function to get page metadata along with blocks
CREATE OR REPLACE FUNCTION get_page_with_blocks_by_slug(page_slug text)
RETURNS TABLE (
  page_id uuid,
  page_name text,
  page_slug text,
  page_description text,
  is_published boolean,
  page_metadata jsonb,
  block_id uuid,
  block_title text,
  block_description text,
  block_type text,
  block_content jsonb,
  block_position int,
  block_background text,
  block_visibility jsonb,
  block_animation text,
  block_layout text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    p.id AS page_id,
    p.name AS page_name,
    p.slug AS page_slug,
    p.description AS page_description,
    p.is_published,
    p.metadata AS page_metadata,
    b.id AS block_id,
    b.title AS block_title,
    b.description AS block_description,
    b.block_type,
    b.content AS block_content,
    b."position" AS block_position,
    b.background_color AS block_background,
    b.visibility_rules AS block_visibility,
    b.animation AS block_animation,
    b.layout_mode AS block_layout
  FROM page_layouts p
  LEFT JOIN ui_blocks b ON b.page_id = p.id
  WHERE p.slug = page_slug
  AND p.is_published = true
  ORDER BY b."position"
$$;

-- Comment explaining usage
COMMENT ON FUNCTION get_ui_blocks_for_page IS 'Fetches UI blocks for a specific page by slug. Call this function from the API or Edge Function to render pages dynamically.';