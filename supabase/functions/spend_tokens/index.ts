import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SpendTokensRequest {
  user_id: string;
  tokens: number;
  action: string;
}

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

    const { user_id, tokens, action }: SpendTokensRequest = await req.json();

    if (!user_id || !tokens || !action) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get current token balance
    const { data: userData, error: userError } = await supabase
      .from('user_tokens')
      .select('balance')
      .eq('user_id', user_id)
      .single();

    if (userError) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not found or has no token balance' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user has enough tokens
    if (userData.balance < tokens) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Insufficient tokens', 
          balance: userData.balance,
          required: tokens
        }),
        {
          status: 402, // Payment Required
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Deduct tokens
    const newBalance = userData.balance - tokens;
    const { error: updateError } = await supabase
      .from('user_tokens')
      .update({ balance: newBalance })
      .eq('user_id', user_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update token balance' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Log the transaction
    const { error: logError } = await supabase
      .from('token_transactions')
      .insert({
        user_id,
        tokens_deducted: tokens,
        type: 'deduction',
        // Store the action in metadata if needed
        metadata: { action }
      });

    if (logError) {
      console.error('Error logging transaction:', logError);
      // Continue even if logging fails
    }

    // Return success with new balance
    return new Response(
      JSON.stringify({ 
        success: true, 
        previous_balance: userData.balance,
        new_balance: newBalance,
        tokens_spent: tokens,
        action
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});