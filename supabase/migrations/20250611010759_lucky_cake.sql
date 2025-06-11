/*
  # Update Page Layouts Table

  1. Changes
    - Add default column to page_layouts table if it doesn't exist
    - Update existing RPC functions to include default flag in results
    - Add migration safety checks to prevent errors
*/

-- Add default column to page_layouts if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'page_layouts' AND column_name = 'default'
  ) THEN
    ALTER TABLE page_layouts ADD COLUMN "default" boolean DEFAULT false;
  END IF;
END $$;

-- Update get_page_with_blocks function to include default flag
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
    'default', p."default",
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

-- Create function to get default page
CREATE OR REPLACE FUNCTION get_default_page()
RETURNS jsonb AS $$
DECLARE
  v_page jsonb;
  v_blocks jsonb;
  v_page_id uuid;
  v_page_slug text;
BEGIN
  -- Get the default page
  SELECT id, slug INTO v_page_id, v_page_slug
  FROM page_layouts
  WHERE "default" = true
  AND is_published = true
  LIMIT 1;
  
  -- If no default page, get the first published page
  IF v_page_id IS NULL THEN
    SELECT id, slug INTO v_page_id, v_page_slug
    FROM page_layouts
    WHERE is_published = true
    ORDER BY created_at
    LIMIT 1;
  END IF;
  
  -- If still no page, return null
  IF v_page_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Use existing function to get page with blocks
  RETURN get_page_with_blocks(v_page_slug);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all published pages
CREATE OR REPLACE FUNCTION get_published_pages()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  is_default boolean,
  metadata jsonb,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.slug,
    p.description,
    p."default" as is_default,
    p.metadata,
    p.updated_at
  FROM page_layouts p
  WHERE p.is_published = true
  ORDER BY p."default" DESC, p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;