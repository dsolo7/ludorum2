import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface AnalyzerRequest {
  user_id: string
  model_id: string
  input_data: any
}

async function deductTokens({ user_id, model_id }: { user_id: string, model_id: string }) {
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
      return { error: 'You don\'t have enough tokens to run this analyzer. Please upgrade your plan or earn more tokens.' }
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

async function runAnalyzer({ user_id, model_id, input_data }: AnalyzerRequest) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Get AI model details
    const { data: aiModel, error: modelError } = await supabase
      .from('ai_models')
      .select(`
        *,
        llm_providers (name, api_key, base_url, model_name)
      `)
      .eq('id', model_id)
      .eq('is_active', true)
      .single()

    if (modelError || !aiModel) {
      return { error: 'AI model not found or inactive' }
    }

    // Simulate AI analysis (replace with actual AI logic)
    const analysisResult = {
      model_name: aiModel.name,
      analysis: 'This is a simulated analysis result. In a real implementation, this would contain the actual AI-generated insights.',
      confidence: 0.85,
      recommendations: [
        'Based on historical data, this bet has a 65% success rate',
        'Consider the weather conditions for outdoor sports',
        'Player injury reports suggest caution on this selection'
      ],
      processed_at: new Date().toISOString()
    }

    // Log the analysis
    await supabase.from('analyzer_inputs').insert({
      user_id,
      ai_model_id: model_id,
      input_type: 'text',
      input_text: JSON.stringify(input_data),
      response: JSON.stringify(analysisResult)
    })

    return { success: true, result: analysisResult }
  } catch (error) {
    console.error('Analyzer error:', error)
    return { error: 'Analysis failed' }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, model_id, input_data }: AnalyzerRequest = await req.json()

    if (!user_id || !model_id) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id or model_id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // STEP 1: Check and deduct tokens BEFORE running analyzer
    console.log(`Checking tokens for user ${user_id} and model ${model_id}`)
    const tokenResult = await deductTokens({ user_id, model_id })

    if (tokenResult.error) {
      console.log(`Token check failed: ${tokenResult.error}`)
      return new Response(
        JSON.stringify({ 
          error: tokenResult.error,
          type: 'insufficient_tokens'
        }),
        {
          status: 402, // Payment Required
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Tokens deducted successfully: ${tokenResult.tokens_deducted}, remaining: ${tokenResult.remaining_balance}`)

    // STEP 2: Run the analyzer only if tokens were successfully deducted
    const analysisResult = await runAnalyzer({ user_id, model_id, input_data })

    if (analysisResult.error) {
      // If analysis fails after token deduction, we should consider refunding tokens
      // For now, we'll just return the error
      return new Response(
        JSON.stringify(analysisResult),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // STEP 3: Return successful result with token info
    return new Response(
      JSON.stringify({
        ...analysisResult,
        tokens_used: tokenResult.tokens_deducted,
        remaining_tokens: tokenResult.remaining_balance
      }),
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