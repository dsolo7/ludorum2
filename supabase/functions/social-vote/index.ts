import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SocialVoteRequest {
  user_id: string
  analyzer_request_id?: string
  prediction_card_id?: string
  vote_type: 'up' | 'down'
}

async function processSocialVote(request: SocialVoteRequest) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Check if user already voted on this item
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('social_votes')
      .select('id, vote_type')
      .eq('user_id', request.user_id)
      .eq('analyzer_request_id', request.analyzer_request_id || null)
      .eq('prediction_card_id', request.prediction_card_id || null)
      .single()

    if (existingVote) {
      // Update existing vote if different
      if (existingVote.vote_type !== request.vote_type) {
        const { error: updateError } = await supabase
          .from('social_votes')
          .update({ 
            vote_type: request.vote_type,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingVote.id)

        if (updateError) {
          throw new Error('Failed to update vote')
        }

        return {
          success: true,
          action: 'updated',
          vote_type: request.vote_type
        }
      } else {
        return {
          success: true,
          action: 'no_change',
          vote_type: request.vote_type
        }
      }
    }

    // Create new vote
    const { error: insertError } = await supabase
      .from('social_votes')
      .insert({
        user_id: request.user_id,
        analyzer_request_id: request.analyzer_request_id || null,
        prediction_card_id: request.prediction_card_id || null,
        vote_type: request.vote_type
      })

    if (insertError) {
      throw new Error('Failed to record vote')
    }

    return {
      success: true,
      action: 'created',
      vote_type: request.vote_type
    }

  } catch (error) {
    console.error('Social vote error:', error)
    return {
      success: false,
      error: error.message || 'Failed to record vote'
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: SocialVoteRequest = await req.json()

    if (!request.user_id || !request.vote_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!request.analyzer_request_id && !request.prediction_card_id) {
      return new Response(
        JSON.stringify({ error: 'Must specify either analyzer_request_id or prediction_card_id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const result = await processSocialVote(request)

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify(result),
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