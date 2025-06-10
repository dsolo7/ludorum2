import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ContestEntryRequest {
  user_id: string
  contest_id: string
  prediction_card_id?: string
  prediction_value: string
  confidence_level?: number
}

async function processContestEntry(request: ContestEntryRequest) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Get contest details and token cost
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .select('*')
      .eq('id', request.contest_id)
      .eq('status', 'active')
      .single()

    if (contestError || !contest) {
      throw new Error('Contest not found or inactive')
    }

    // Check if contest is full
    if (contest.max_entries && contest.current_entries >= contest.max_entries) {
      throw new Error('Contest is full')
    }

    // Check if user already entered this contest
    const { data: existingEntry, error: entryCheckError } = await supabase
      .from('contest_entries')
      .select('id')
      .eq('contest_id', request.contest_id)
      .eq('user_id', request.user_id)
      .eq('prediction_card_id', request.prediction_card_id || null)
      .single()

    if (existingEntry) {
      throw new Error('You have already entered this contest')
    }

    const tokenCost = contest.token_cost

    // Check user token balance
    const { data: userTokens, error: tokenError } = await supabase
      .from('user_tokens')
      .select('balance')
      .eq('user_id', request.user_id)
      .single()

    if (tokenError || !userTokens || userTokens.balance < tokenCost) {
      throw new Error('Insufficient tokens')
    }

    // Start transaction-like operations
    // 1. Deduct tokens
    const { error: deductError } = await supabase
      .from('user_tokens')
      .update({ balance: userTokens.balance - tokenCost })
      .eq('user_id', request.user_id)

    if (deductError) {
      throw new Error('Failed to deduct tokens')
    }

    // 2. Log token transaction
    await supabase.from('token_transactions').insert({
      user_id: request.user_id,
      tokens_deducted: tokenCost,
      type: 'deduction'
    })

    // 3. Create contest entry
    const { data: contestEntry, error: entryError } = await supabase
      .from('contest_entries')
      .insert({
        contest_id: request.contest_id,
        prediction_card_id: request.prediction_card_id || null,
        user_id: request.user_id,
        prediction_value: request.prediction_value,
        confidence_level: request.confidence_level || 3,
        tokens_spent: tokenCost
      })
      .select()
      .single()

    if (entryError) {
      // Rollback token deduction if entry creation fails
      await supabase
        .from('user_tokens')
        .update({ balance: userTokens.balance })
        .eq('user_id', request.user_id)
      
      throw new Error('Failed to create contest entry')
    }

    // 4. Update contest entry count
    const { error: updateError } = await supabase
      .from('contests')
      .update({ current_entries: contest.current_entries + 1 })
      .eq('id', request.contest_id)

    if (updateError) {
      console.error('Failed to update contest entry count:', updateError)
      // Don't fail the entire operation for this
    }

    return {
      success: true,
      entry_id: contestEntry.id,
      tokens_spent: tokenCost,
      remaining_balance: userTokens.balance - tokenCost,
      contest_title: contest.title
    }

  } catch (error) {
    console.error('Contest entry error:', error)
    return {
      success: false,
      error: error.message || 'Failed to enter contest'
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: ContestEntryRequest = await req.json()

    if (!request.user_id || !request.contest_id || !request.prediction_value) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const result = await processContestEntry(request)

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