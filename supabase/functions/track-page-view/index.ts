import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface PageViewRequest {
  page_id: string
  user_id?: string
  device_type?: string
  time_on_page?: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { page_id, user_id, device_type, time_on_page }: PageViewRequest = await req.json()

    if (!page_id) {
      return new Response(
        JSON.stringify({ error: 'Missing page_id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get current user if not provided
    let userId = user_id
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id
    }

    // If still no user_id, use anonymous tracking
    if (!userId) {
      // For anonymous users, just increment a counter without user association
      await supabase.rpc('track_page_view', {
        p_page_id: page_id,
        p_user_id: null,
        p_device_type: device_type,
        p_time_on_page: time_on_page
      })
    } else {
      // For authenticated users, track with user association
      await supabase.rpc('track_page_view', {
        p_page_id: page_id,
        p_user_id: userId,
        p_device_type: device_type,
        p_time_on_page: time_on_page
      })
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})