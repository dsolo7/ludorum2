import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface UpdateStreakRequest {
  user_id: string
}

async function updateUserStreak(userId: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Get current streak info
    const { data: userStreak, error: streakError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (streakError && streakError.code !== 'PGRST116') {
      throw streakError
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayStr = today.toISOString().split('T')[0]
    
    // Check if user already logged in today
    if (userStreak?.last_activity_date === todayStr) {
      return { 
        success: true, 
        message: 'Streak already updated today',
        current_streak: userStreak.current_streak,
        longest_streak: userStreak.longest_streak
      }
    }

    let newStreak = 1
    let longestStreak = userStreak?.longest_streak || 0

    // If user has a previous streak, check if it's consecutive
    if (userStreak) {
      const lastActivity = new Date(userStreak.last_activity_date)
      lastActivity.setHours(0, 0, 0, 0)
      
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      // If last activity was yesterday, increment streak
      if (lastActivity.getTime() === yesterday.getTime()) {
        newStreak = userStreak.current_streak + 1
      }
      
      // Update longest streak if needed
      longestStreak = Math.max(longestStreak, newStreak)
    }

    // Update or insert streak record
    const { error: updateError } = await supabase
      .from('user_streaks')
      .upsert({
        user_id: userId,
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_activity_date: todayStr,
        updated_at: new Date().toISOString()
      })

    if (updateError) throw updateError

    // Check if streak badge should be awarded
    if (newStreak >= 7) {
      await checkAndAwardStreakBadge(supabase, userId)
    }

    return { 
      success: true, 
      current_streak: newStreak,
      longest_streak: longestStreak,
      is_new_record: newStreak > (userStreak?.longest_streak || 0)
    }
  } catch (error) {
    console.error('Error updating streak:', error)
    return { success: false, error: error.message || 'Failed to update streak' }
  }
}

async function checkAndAwardStreakBadge(supabase: any, userId: string) {
  try {
    // Check if user already has the streak badge
    const { data: existingBadge, error: badgeError } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_id', 'streak_master')
      .single()

    if (badgeError && badgeError.code !== 'PGRST116') {
      throw badgeError
    }

    // If user doesn't have the badge, award it
    if (!existingBadge) {
      // Get badge details
      const { data: badge, error: badgeDefError } = await supabase
        .from('badge_definitions')
        .select('*')
        .eq('id', 'streak_master')
        .single()

      if (badgeDefError) throw badgeDefError

      // Award badge
      const { error: awardError } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: 'streak_master'
        })

      if (awardError) throw awardError

      // Award XP
      const { data: userXP, error: xpError } = await supabase
        .from('user_xp')
        .select('xp_points, level')
        .eq('user_id', userId)
        .single()

      if (xpError && xpError.code !== 'PGRST116') {
        throw xpError
      }

      const currentXP = userXP?.xp_points || 0
      const currentLevel = userXP?.level || 1
      const newXP = currentXP + badge.xp_reward
      const newLevel = 1 + Math.floor(newXP / 1000)

      await supabase
        .from('user_xp')
        .upsert({
          user_id: userId,
          xp_points: newXP,
          level: Math.max(currentLevel, newLevel),
          updated_at: new Date().toISOString()
        })

      return { badge_awarded: true, xp_awarded: badge.xp_reward }
    }

    return { badge_awarded: false }
  } catch (error) {
    console.error('Error checking streak badge:', error)
    return { badge_awarded: false, error: error.message }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id }: UpdateStreakRequest = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const result = await updateUserStreak(user_id)

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