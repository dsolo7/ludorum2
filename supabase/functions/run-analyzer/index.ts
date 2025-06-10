import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface AnalyzerRequest {
  user_id: string
  model_id: string
  image_url?: string
  input_text?: string
  metadata?: any
}

async function processAnalyzerRequest(request: AnalyzerRequest) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Get AI model details with token cost
    const { data: model, error: modelError } = await supabase
      .from('ai_models')
      .select(`
        *,
        sports (name),
        betting_types (name),
        llm_providers (name, api_key, base_url, model_name),
        model_token_settings (tokens_required)
      `)
      .eq('id', request.model_id)
      .eq('is_active', true)
      .single()

    if (modelError || !model) {
      throw new Error('AI model not found or inactive')
    }

    const tokenCost = model.model_token_settings?.[0]?.tokens_required || 1

    // Check user token balance
    const { data: userTokens, error: tokenError } = await supabase
      .from('user_tokens')
      .select('balance')
      .eq('user_id', request.user_id)
      .single()

    if (tokenError || !userTokens || userTokens.balance < tokenCost) {
      throw new Error('Insufficient tokens')
    }

    // Create analyzer request record
    const { data: analyzerRequest, error: requestError } = await supabase
      .from('analyzer_requests')
      .insert({
        user_id: request.user_id,
        model_id: request.model_id,
        image_url: request.image_url,
        input_text: request.input_text,
        metadata: request.metadata || {},
        status: 'processing',
        tokens_used: tokenCost
      })
      .select()
      .single()

    if (requestError) {
      throw new Error('Failed to create analyzer request')
    }

    // Deduct tokens
    const { error: deductError } = await supabase
      .from('user_tokens')
      .update({ balance: userTokens.balance - tokenCost })
      .eq('user_id', request.user_id)

    if (deductError) {
      throw new Error('Failed to deduct tokens')
    }

    // Log token transaction
    await supabase.from('token_transactions').insert({
      user_id: request.user_id,
      model_id: request.model_id,
      tokens_deducted: tokenCost,
      type: 'deduction'
    })

    // Simulate AI analysis (replace with actual LLM call)
    const analysisResult = {
      confidence: Math.random() * 0.3 + 0.7, // 70-100%
      analysis: `Based on the ${model.sports?.name} ${model.betting_types?.name} analysis, here are the key insights from your betting slip.`,
      recommendations: [
        'Consider the recent team performance trends',
        'Weather conditions may impact the game outcome',
        'Player injury reports suggest caution on certain picks'
      ],
      risk_assessment: Math.random() > 0.5 ? 'moderate' : 'low',
      value_rating: Math.floor(Math.random() * 5) + 1,
      processed_at: new Date().toISOString()
    }

    // Update request with results
    const { error: updateError } = await supabase
      .from('analyzer_requests')
      .update({
        status: 'completed',
        result: analysisResult,
        updated_at: new Date().toISOString()
      })
      .eq('id', analyzerRequest.id)

    if (updateError) {
      throw new Error('Failed to update analyzer request')
    }

    return {
      success: true,
      request_id: analyzerRequest.id,
      tokens_used: tokenCost,
      remaining_balance: userTokens.balance - tokenCost,
      result: analysisResult
    }

  } catch (error) {
    console.error('Analyzer processing error:', error)
    return {
      success: false,
      error: error.message || 'Analysis failed'
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: AnalyzerRequest = await req.json()

    if (!request.user_id || !request.model_id) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id or model_id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const result = await processAnalyzerRequest(request)

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