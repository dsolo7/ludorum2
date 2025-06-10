import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface BlockInteractionRequest {
  block_id: string
  user_id?: string
  interaction_type: string
  tokens_spent?: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { block_id, user_id, interaction_type, tokens_spent = 0 }: BlockInteractionRequest = await req.json()

    if (!block_id || !interaction_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
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
      await supabase.rpc('track_block_interaction', {
        p_block_id: block_id,
        p_user_id: null,
        p_interaction_type: interaction_type,
        p_tokens_spent: tokens_spent
      })
    } else {
      // For authenticated users, track with user association
      await supabase.rpc('track_block_interaction', {
        p_block_id: block_id,
        p_user_id: userId,
        p_interaction_type: interaction_type,
        p_tokens_spent: tokens_spent
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