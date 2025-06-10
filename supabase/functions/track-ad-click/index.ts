import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ClickRequest {
  ad_id: string
  user_id?: string
}

async function trackClick(request: ClickRequest) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Insert click record
    const { error } = await supabase
      .from('ad_clicks')
      .insert({
        ad_id: request.ad_id,
        user_id: request.user_id || null
      })

    if (error) {
      throw new Error('Failed to track click')
    }

    return { success: true }

  } catch (error) {
    console.error('Click tracking error:', error)
    return {
      success: false,
      error: error.message || 'Failed to track click'
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: ClickRequest = await req.json()

    if (!request.ad_id) {
      return new Response(
        JSON.stringify({ error: 'Missing ad_id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const result = await trackClick(request)

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 400,
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