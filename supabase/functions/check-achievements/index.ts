import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CheckAchievementsRequest {
  user_id: string
}

interface Badge {
  id: string
  name: string
  description: string
  xp_reward: number
}

async function checkAndAwardBadges(userId: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Get all badge definitions
    const { data: badges, error: badgesError } = await supabase
      .from('badge_definitions')
      .select('*')

    if (badgesError) throw badgesError

    // Get user's current badges
    const { data: userBadges, error: userBadgesError } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId)

    if (userBadgesError) throw userBadgesError

    const earnedBadgeIds = userBadges?.map(ub => ub.badge_id) || []
    const newBadges: Badge[] = []

    // Check each badge condition
    for (const badge of badges || []) {
      if (earnedBadgeIds.includes(badge.id)) continue

      let shouldAward = false

      switch (badge.id) {
        case 'first_win':
          // Check if user has any correct contest entries
          const { count: winCount } = await supabase
            .from('contest_entries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_correct', true)
          
          shouldAward = (winCount || 0) > 0
          break

        case 'streak_master':
          // Check if user has a 7-day streak
          const { data: streak } = await supabase
            .from('user_streaks')
            .select('current_streak')
            .eq('user_id', userId)
            .single()
          
          shouldAward = (streak?.current_streak || 0) >= 7
          break

        case 'contest_champion':
          // Check if user has won any contests (simplified)
          const { count: contestWins } = await supabase
            .from('contest_entries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_correct', true)
          
          shouldAward = (contestWins || 0) > 0
          break

        case 'social_butterfly':
          // Check if user has made 50+ social votes
          const { count: voteCount } = await supabase
            .from('social_votes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
          
          shouldAward = (voteCount || 0) >= 50
          break

        case 'high_roller':
          // Check if user has spent 1000+ tokens
          const { data: transactions } = await supabase
            .from('token_transactions')
            .select('tokens_deducted')
            .eq('user_id', userId)
            .eq('type', 'deduction')
          
          const totalSpent = transactions?.reduce((sum, t) => sum + (t.tokens_deducted || 0), 0) || 0
          shouldAward = totalSpent >= 1000
          break

        case 'accuracy_ace':
          // Check if user has 80%+ accuracy over 20+ predictions
          const { data: entries } = await supabase
            .from('contest_entries')
            .select('is_correct')
            .eq('user_id', userId)
            .not('is_correct', 'is', null)
          
          if (entries && entries.length >= 20) {
            const correctCount = entries.filter(e => e.is_correct).length
            const accuracy = (correctCount / entries.length) * 100
            shouldAward = accuracy >= 80
          }
          break
      }

      if (shouldAward) {
        // Award the badge
        const { error: awardError } = await supabase
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_id: badge.id
          })

        if (awardError) {
          console.error(`Error awarding badge ${badge.id}:`, awardError)
          continue
        }

        // Award XP
        await awardXP(supabase, userId, badge.xp_reward)

        newBadges.push(badge)
      }
    }

    return { success: true, new_badges: newBadges }
  } catch (error) {
    console.error('Error checking achievements:', error)
    return { success: false, error: error.message || 'Failed to check achievements' }
  }
}

async function awardXP(supabase: any, userId: string, xpAmount: number) {
  try {
    // Get current XP
    const { data: userXP, error: xpError } = await supabase
      .from('user_xp')
      .select('xp_points, level')
      .eq('user_id', userId)
      .single()

    if (xpError && xpError.code !== 'PGRST116') {
      throw xpError
    }

    let currentXP = userXP?.xp_points || 0
    let currentLevel = userXP?.level || 1
    const newXP = currentXP + xpAmount

    // Calculate new level (simple formula: level = 1 + floor(xp / 1000))
    const newLevel = 1 + Math.floor(newXP / 1000)

    // Upsert XP record
    const { error: updateError } = await supabase
      .from('user_xp')
      .upsert({
        user_id: userId,
        xp_points: newXP,
        level: Math.max(currentLevel, newLevel),
        updated_at: new Date().toISOString()
      })

    if (updateError) throw updateError

    return { success: true, new_xp: newXP, new_level: newLevel }
  } catch (error) {
    console.error('Error awarding XP:', error)
    return { success: false, error: error.message || 'Failed to award XP' }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id }: CheckAchievementsRequest = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const result = await checkAndAwardBadges(user_id)

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