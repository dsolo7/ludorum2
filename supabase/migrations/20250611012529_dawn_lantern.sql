/*
  # UI Blocks Query Functions
  
  1. New Functions
    - `get_ui_blocks_for_page`: Basic function to get UI blocks for a page
    - `get_ui_blocks_for_page_full`: Comprehensive function returning all block data
    - `get_page_with_blocks_by_slug`: Function to get page metadata with blocks
    
  2. Security
    - All functions use SECURITY DEFINER to run with creator's privileges
    - Only published pages are returned
*/

create or replace function get_ui_blocks_for_page(page_slug text)
returns table (
  id uuid,
  block_type text,
  block_data jsonb,
  visibility_rule jsonb,
  sort_order int
)
language sql
security definer
as $$
  select
    b.id,
    b.block_type,
    b.content as block_data,
    b.visibility_rules as visibility_rule,
    b."position" as sort_order
  from ui_blocks b
  inner join page_layouts p on b.page_id = p.id
  where p.slug = page_slug
  and p.is_published = true
  order by b."position"
$$;

-- Create a more comprehensive version that includes all block data
create or replace function get_ui_blocks_for_page_full(page_slug text)
returns table (
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
language sql
security definer
as $$
  select
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
  from ui_blocks b
  inner join page_layouts p on b.page_id = p.id
  where p.slug = page_slug
  and p.is_published = true
  order by b."position"
$$;

-- Create a function to get page metadata along with blocks
create or replace function get_page_with_blocks_by_slug(page_slug text)
returns table (
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
language sql
security definer
as $$
  select
    p.id as page_id,
    p.name as page_name,
    p.slug as page_slug,
    p.description as page_description,
    p.is_published,
    p.metadata as page_metadata,
    b.id as block_id,
    b.title as block_title,
    b.description as block_description,
    b.block_type,
    b.content as block_content,
    b."position" as block_position,
    b.background_color as block_background,
    b.visibility_rules as block_visibility,
    b.animation as block_animation,
    b.layout_mode as block_layout
  from page_layouts p
  left join ui_blocks b on b.page_id = p.id
  where p.slug = page_slug
  and p.is_published = true
  order by b."position"
$$;

-- Comment explaining usage
COMMENT ON FUNCTION get_ui_blocks_for_page IS 'Fetches UI blocks for a specific page by slug. Call this function from the API or Edge Function to render pages dynamically.';