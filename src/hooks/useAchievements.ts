import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface Achievement {
  id: string;
  name: string;
  description: string;
  xp_reward: number;
  badge_id?: string;
}

interface UserStats {
  total_predictions: number;
  correct_predictions: number;
  current_streak: number;
  longest_streak: number;
  tokens_spent: number;
  contests_won: number;
  social_votes: number;
  days_active: number;
}

const useAchievements = () => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserStats = useCallback(async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get user profile for created_at date
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', user.id)
        .single();

      // Calculate days active (days since account creation)
      const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date();
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const [
        { count: totalPredictions },
        { data: streakData },
        { count: correctPredictions },
        { data: tokenData },
        { count: socialVotes },
        { count: contestsWon },
        { data: userStreaks }
      ] = await Promise.all([
        supabase.from('contest_entries').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('contest_entries').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_correct', true),
        supabase.from('user_streaks').select('current_streak').eq('user_id', user.id).single(),
        supabase.from('token_transactions').select('tokens_deducted').eq('user_id', user.id).eq('type', 'deduction'),
        supabase.from('social_votes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('contest_entries').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_correct', true),
        supabase.from('user_streaks').select('*').eq('user_id', user.id).single()
      ]);

      const tokensSpent = tokenData?.reduce((sum, t) => sum + (t.tokens_deducted || 0), 0) || 0;

      const stats: UserStats = {
        total_predictions: totalPredictions || 0,
        correct_predictions: correctPredictions || 0,
        current_streak: userStreaks?.current_streak || 0,
        longest_streak: userStreaks?.longest_streak || 0,
        tokens_spent: tokensSpent,
        contests_won: contestsWon || 0,
        social_votes: socialVotes || 0,
        days_active: diffDays || 1
      };

      setUserStats(stats);
      return stats;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  }, []);

  const checkAchievements = useCallback(async (stats?: UserStats) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentStats = stats || userStats;
      if (!currentStats) return;

      // Get existing badges
      const { data: existingBadges } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', user.id);

      const existingBadgeIds = existingBadges?.map(b => b.badge_id) || [];

      // Define achievement conditions
      const achievementChecks = [
        {
          id: 'first_prediction',
          name: 'First Steps',
          description: 'Make your first prediction',
          xp_reward: 100,
          badge_id: 'first_win',
          condition: currentStats.total_predictions >= 1
        },
        {
          id: 'streak_warrior',
          name: 'Streak Warrior',
          description: 'Maintain a 7-day activity streak',
          xp_reward: 250,
          badge_id: 'streak_master',
          condition: currentStats.current_streak >= 7
        },
        {
          id: 'social_butterfly',
          name: 'Social Butterfly',
          description: 'Vote on 50 community predictions',
          xp_reward: 200,
          badge_id: 'social_butterfly',
          condition: currentStats.social_votes >= 50
        },
        {
          id: 'big_spender',
          name: 'High Roller',
          description: 'Spend 1000 tokens on AI analysis',
          xp_reward: 300,
          badge_id: 'high_roller',
          condition: currentStats.tokens_spent >= 1000
        },
        {
          id: 'contest_champion',
          name: 'Contest Champion',
          description: 'Win your first prediction contest',
          xp_reward: 500,
          badge_id: 'contest_champion',
          condition: currentStats.contests_won >= 1
        }
      ];

      const newlyUnlocked: Achievement[] = [];

      for (const achievement of achievementChecks) {
        if (achievement.condition && achievement.badge_id && !existingBadgeIds.includes(achievement.badge_id)) {
          // Award the badge
          await supabase.from('user_badges').insert({
            user_id: user.id,
            badge_id: achievement.badge_id
          });

          // Award XP
          const { data: currentXP } = await supabase
            .from('user_xp')
            .select('xp_points, level')
            .eq('user_id', user.id)
            .single();

          const newXP = (currentXP?.xp_points || 0) + achievement.xp_reward;
          const newLevel = Math.floor(newXP / 1000) + 1;

          await supabase.from('user_xp').upsert({
            user_id: user.id,
            xp_points: newXP,
            level: newLevel
          });

          newlyUnlocked.push({
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            xp_reward: achievement.xp_reward,
            badge_id: achievement.badge_id
          });
        }
      }

      if (newlyUnlocked.length > 0) {
        setNewAchievements(prev => [...prev, ...newlyUnlocked]);
      }

    } catch (error) {
      console.error('Error checking achievements:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userStats]);

  const clearNewAchievements = useCallback(() => {
    setNewAchievements([]);
  }, []);

  const updateStats = useCallback(async () => {
    const stats = await fetchUserStats();
    if (stats) {
      await checkAchievements(stats);
    }
  }, [fetchUserStats, checkAchievements]);

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  return {
    userStats,
    newAchievements,
    isLoading,
    updateStats,
    clearNewAchievements
  };
};

export default useAchievements;