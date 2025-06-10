import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface DeductTokensRequest {
  user_id: string
  model_id: string
}

export async function deductTokens({ user_id, model_id }: DeductTokensRequest) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Get token cost for the model
    const { data: tokenSettings, error: tokenError } = await supabase
      .from('model_token_settings')
      .select('tokens_required')
      .eq('model_id', model_id)
      .single()

    if (tokenError || !tokenSettings) {
      return { error: 'Token config missing for this model' }
    }

    const cost = tokenSettings.tokens_required

    // Get user token balance
    const { data: userToken, error: userError } = await supabase
      .from('user_tokens')
      .select('balance')
      .eq('user_id', user_id)
      .single()

    if (userError || !userToken || userToken.balance < cost) {
      return { error: 'Insufficient tokens' }
    }

    // Deduct tokens
    const { error: updateError } = await supabase
      .from('user_tokens')
      .update({ balance: userToken.balance - cost })
      .eq('user_id', user_id)

    // Log transaction
    await supabase.from('token_transactions').insert({
      user_id,
      model_id,
      tokens_deducted: cost,
      type: 'deduction'
    })

    if (updateError) {
      return { error: 'Token deduction failed' }
    }

    return { success: true, tokens_deducted: cost, remaining_balance: userToken.balance - cost }
  } catch (error) {
    console.error('Token deduction error:', error)
    return { error: 'Token deduction failed' }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, model_id }: DeductTokensRequest = await req.json()

    if (!user_id || !model_id) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id or model_id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const result = await deductTokens({ user_id, model_id })

    if (result.error) {
      return new Response(
        JSON.stringify(result),
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