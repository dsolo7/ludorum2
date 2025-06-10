import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ImpressionRequest {
  ad_id: string
  user_id?: string
  page_url: string
  sport_category?: string
  device_type?: string
}

async function trackImpression(request: ImpressionRequest) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Insert impression record
    const { error } = await supabase
      .from('ad_impressions')
      .insert({
        ad_id: request.ad_id,
        user_id: request.user_id || null,
        page_url: request.page_url,
        sport_category: request.sport_category || null,
        device_type: request.device_type || null
      })

    if (error) {
      throw new Error('Failed to track impression')
    }

    return { success: true }

  } catch (error) {
    console.error('Impression tracking error:', error)
    return {
      success: false,
      error: error.message || 'Failed to track impression'
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: ImpressionRequest = await req.json()

    if (!request.ad_id || !request.page_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const result = await trackImpression(request)

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