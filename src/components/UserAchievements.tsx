import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Star, 
  Trophy, 
  Target, 
  Zap, 
  Users, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  Lock,
  Gift,
  Flame,
  Crown,
  Medal
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import ConfettiAnimation from './ConfettiAnimation';
import AnimatedTokenCounter from './AnimatedTokenCounter';

interface UserAchievementsProps {
  userId?: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  xp_reward: number;
}

interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badge_definitions: Badge;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  target_value: number;
  current_progress: number;
  is_unlocked: boolean;
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

const UserAchievements: React.FC<UserAchievementsProps> = ({ userId }) => {
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);
  const [activeTab, setActiveTab] = useState<'earned' | 'available' | 'progress'>('earned');

  useEffect(() => {
    fetchUserAchievements();
    fetchUserStats();
  }, []);

  const fetchUserAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch earned badges
      const { data: badges, error: badgesError } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge_definitions (*)
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (badgesError) throw badgesError;
      setUserBadges(badges || []);

      // Generate achievements based on user progress
      await generateAchievements(user.id);

    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch various user statistics
      const [
        { count: totalPredictions },
        { data: streakData },
        { data: tokenData },
        { count: socialVotes }
      ] = await Promise.all([
        supabase.from('contest_entries').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('user_streaks').select('*').eq('user_id', user.id).single(),
        supabase.from('token_transactions').select('tokens_deducted').eq('user_id', user.id).eq('type', 'deduction'),
        supabase.from('social_votes').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      ]);

      const tokensSpent = tokenData?.reduce((sum, t) => sum + (t.tokens_deducted || 0), 0) || 0;

      setUserStats({
        total_predictions: totalPredictions || 0,
        correct_predictions: 0, // Would need to calculate based on resolved contests
        current_streak: streakData?.current_streak || 0,
        longest_streak: streakData?.longest_streak || 0,
        tokens_spent: tokensSpent,
        contests_won: 0, // Would need to calculate based on contest results
        social_votes: socialVotes || 0,
        days_active: 1 // Would need to calculate based on activity logs
      });

    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const generateAchievements = async (userId: string) => {
    // Define achievement templates
    const achievementTemplates: Omit<Achievement, 'current_progress' | 'is_unlocked'>[] = [
      {
        id: 'first_prediction',
        name: 'First Steps',
        description: 'Make your first prediction',
        icon: 'target',
        category: 'Getting Started',
        target_value: 1,
        xp_reward: 100,
        badge_id: 'first_win'
      },
      {
        id: 'prediction_master',
        name: 'Prediction Master',
        description: 'Make 100 predictions',
        icon: 'trophy',
        category: 'Predictions',
        target_value: 100,
        xp_reward: 500
      },
      {
        id: 'streak_warrior',
        name: 'Streak Warrior',
        description: 'Maintain a 7-day activity streak',
        icon: 'flame',
        category: 'Engagement',
        target_value: 7,
        xp_reward: 250,
        badge_id: 'streak_master'
      },
      {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Vote on 50 community predictions',
        icon: 'users',
        category: 'Social',
        target_value: 50,
        xp_reward: 200,
        badge_id: 'social_butterfly'
      },
      {
        id: 'big_spender',
        name: 'High Roller',
        description: 'Spend 1000 tokens on AI analysis',
        icon: 'zap',
        category: 'Engagement',
        target_value: 1000,
        xp_reward: 300,
        badge_id: 'high_roller'
      },
      {
        id: 'contest_champion',
        name: 'Contest Champion',
        description: 'Win your first prediction contest',
        icon: 'crown',
        category: 'Contests',
        target_value: 1,
        xp_reward: 500,
        badge_id: 'contest_champion'
      },
      {
        id: 'accuracy_ace',
        name: 'Accuracy Ace',
        description: 'Achieve 80% prediction accuracy over 20 bets',
        icon: 'star',
        category: 'Skill',
        target_value: 80,
        xp_reward: 750,
        badge_id: 'accuracy_ace'
      }
    ];

    // Calculate progress for each achievement
    const achievements: Achievement[] = achievementTemplates.map(template => {
      let currentProgress = 0;

      switch (template.id) {
        case 'first_prediction':
          currentProgress = userStats?.total_predictions || 0;
          break;
        case 'prediction_master':
          currentProgress = userStats?.total_predictions || 0;
          break;
        case 'streak_warrior':
          currentProgress = userStats?.current_streak || 0;
          break;
        case 'social_butterfly':
          currentProgress = userStats?.social_votes || 0;
          break;
        case 'big_spender':
          currentProgress = userStats?.tokens_spent || 0;
          break;
        case 'contest_champion':
          currentProgress = userStats?.contests_won || 0;
          break;
        case 'accuracy_ace':
          // Calculate accuracy percentage
          const total = userStats?.total_predictions || 0;
          const correct = userStats?.correct_predictions || 0;
          currentProgress = total > 0 ? Math.round((correct / total) * 100) : 0;
          break;
        default:
          currentProgress = 0;
      }

      const isUnlocked = currentProgress >= template.target_value;

      return {
        ...template,
        current_progress: Math.min(currentProgress, template.target_value),
        is_unlocked: isUnlocked
      };
    });

    setAchievements(achievements);

    // Check for newly unlocked achievements
    const newUnlocked = achievements.filter(a => 
      a.is_unlocked && !userBadges.some(b => b.badge_definitions.id === a.badge_id)
    );

    if (newUnlocked.length > 0) {
      setNewlyUnlocked(newUnlocked);
      setShowConfetti(true);
      
      // Award badges for unlocked achievements
      for (const achievement of newUnlocked) {
        if (achievement.badge_id) {
          await awardBadge(userId, achievement.badge_id, achievement.xp_reward);
        }
      }
    }
  };

  const awardBadge = async (userId: string, badgeId: string, xpReward: number) => {
    try {
      // Award the badge
      await supabase.from('user_badges').insert({
        user_id: userId,
        badge_id: badgeId
      });

      // Award XP
      const { data: currentXP } = await supabase
        .from('user_xp')
        .select('xp_points, level')
        .eq('user_id', userId)
        .single();

      const newXP = (currentXP?.xp_points || 0) + xpReward;
      const newLevel = Math.floor(newXP / 1000) + 1; // 1000 XP per level

      await supabase.from('user_xp').upsert({
        user_id: userId,
        xp_points: newXP,
        level: newLevel
      });

    } catch (error) {
      console.error('Error awarding badge:', error);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      target: Target,
      trophy: Trophy,
      flame: Flame,
      users: Users,
      zap: Zap,
      crown: Crown,
      star: Star,
      medal: Medal
    };
    return icons[iconName] || Award;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Getting Started': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'Predictions': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'Engagement': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'Social': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      'Contests': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'Skill': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const earnedAchievements = achievements.filter(a => a.is_unlocked);
  const availableAchievements = achievements.filter(a => !a.is_unlocked);
  const inProgressAchievements = availableAchievements.filter(a => a.current_progress > 0);

  return (
    <div className="space-y-8">
      <ConfettiAnimation 
        isActive={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
            Achievements
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Track your progress and unlock rewards
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {earnedAchievements.length}/{achievements.length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Achievements Unlocked
          </div>
        </div>
      </div>

      {/* Newly Unlocked Notification */}
      {newlyUnlocked.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Gift className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-2" />
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
              🎉 Achievement{newlyUnlocked.length > 1 ? 's' : ''} Unlocked!
            </h3>
          </div>
          <div className="space-y-2">
            {newlyUnlocked.map((achievement) => (
              <div key={achievement.id} className="flex items-center justify-between">
                <span className="font-medium text-yellow-700 dark:text-yellow-300">
                  {achievement.name}
                </span>
                <AnimatedTokenCounter
                  startValue={0}
                  endValue={achievement.xp_reward}
                  isAnimating={true}
                  showChange={false}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('earned')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'earned'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Earned ({earnedAchievements.length})
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'progress'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            In Progress ({inProgressAchievements.length})
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'available'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Available ({availableAchievements.length})
          </button>
        </nav>
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'earned' && earnedAchievements.map((achievement) => {
          const IconComponent = getIconComponent(achievement.icon);
          return (
            <div
              key={achievement.id}
              className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                    <IconComponent className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {achievement.name}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(achievement.category)}`}>
                      {achievement.category}
                    </span>
                  </div>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                {achievement.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {achievement.xp_reward} XP
                  </span>
                </div>
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  Completed!
                </span>
              </div>
            </div>
          );
        })}

        {activeTab === 'progress' && inProgressAchievements.map((achievement) => {
          const IconComponent = getIconComponent(achievement.icon);
          const progressPercentage = getProgressPercentage(achievement.current_progress, achievement.target_value);
          
          return (
            <div
              key={achievement.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                    <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {achievement.name}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(achievement.category)}`}>
                      {achievement.category}
                    </span>
                  </div>
                </div>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                {achievement.description}
              </p>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Progress: {achievement.current_progress}/{achievement.target_value}
                  </span>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {achievement.xp_reward} XP
                  </span>
                </div>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {achievement.target_value - achievement.current_progress} to go
                </span>
              </div>
            </div>
          );
        })}

        {activeTab === 'available' && availableAchievements.filter(a => a.current_progress === 0).map((achievement) => {
          const IconComponent = getIconComponent(achievement.icon);
          
          return (
            <div
              key={achievement.id}
              className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6 opacity-75 hover:opacity-100 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-3 bg-gray-200 dark:bg-gray-700 rounded-lg mr-3">
                    <IconComponent className="h-6 w-6 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-600 dark:text-gray-400">
                      {achievement.name}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(achievement.category)}`}>
                      {achievement.category}
                    </span>
                  </div>
                </div>
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              
              <p className="text-gray-500 dark:text-gray-500 text-sm mb-4">
                {achievement.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-500">
                    {achievement.xp_reward} XP
                  </span>
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  Not started
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty States */}
      {activeTab === 'earned' && earnedAchievements.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No achievements earned yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Start using the platform to unlock your first achievements!
          </p>
        </div>
      )}

      {activeTab === 'progress' && inProgressAchievements.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No achievements in progress
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Start engaging with the platform to begin working toward achievements!
          </p>
        </div>
      )}
    </div>
  );
};

export default UserAchievements;