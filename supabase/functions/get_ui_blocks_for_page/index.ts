import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { page_slug, user_id } = await req.json();

    if (!page_slug) {
      return new Response(
        JSON.stringify({ error: 'Missing page_slug parameter' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Use the RPC function to get blocks for the page
    const { data, error } = await supabase.rpc(
      'get_visible_blocks_for_user',
      { 
        p_page_slug: page_slug,
        p_user_id: user_id || null
      }
    );

    if (error) {
      console.error('Error fetching UI blocks:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the page details
    const { data: pageData, error: pageError } = await supabase
      .from('page_layouts')
      .select('id, name, slug, description, metadata, is_published, default')
      .eq('slug', page_slug)
      .eq('is_published', true)
      .single();

    if (pageError) {
      console.error('Error fetching page:', pageError);
      return new Response(
        JSON.stringify({ error: 'Page not found or not published' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return both page and blocks data
    return new Response(
      JSON.stringify({
        page: pageData,
        blocks: data || []
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});