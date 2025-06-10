import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Award, 
  Users, 
  TrendingUp, 
  Star, 
  Target,
  Zap,
  Calendar,
  BarChart3,
  Gift,
  Crown,
  Flame
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface GamificationStats {
  totalUsers: number;
  totalBadges: number;
  totalXP: number;
  activeStreaks: number;
  leaderboardEntries: number;
  avgUserLevel: number;
}

const GamificationOverview: React.FC = () => {
  const [stats, setStats] = useState<GamificationStats>({
    totalUsers: 0,
    totalBadges: 0,
    totalXP: 0,
    activeStreaks: 0,
    leaderboardEntries: 0,
    avgUserLevel: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGamificationStats();
  }, []);

  const fetchGamificationStats = async () => {
    try {
      setLoading(true);

      // Fetch various gamification statistics
      const [
        { count: totalUsers },
        { count: totalBadges },
        { data: xpData },
        { count: activeStreaks },
        { count: leaderboardEntries }
      ] = await Promise.all([
        supabase.from('user_xp').select('*', { count: 'exact', head: true }),
        supabase.from('user_badges').select('*', { count: 'exact', head: true }),
        supabase.from('user_xp').select('xp_points, level'),
        supabase.from('user_streaks').select('*', { count: 'exact', head: true }).gt('current_streak', 0),
        supabase.from('leaderboard').select('*', { count: 'exact', head: true })
      ]);

      const totalXP = xpData?.reduce((sum, user) => sum + (user.xp_points || 0), 0) || 0;
      const avgUserLevel = xpData?.length > 0 
        ? xpData.reduce((sum, user) => sum + (user.level || 1), 0) / xpData.length 
        : 0;

      setStats({
        totalUsers: totalUsers || 0,
        totalBadges: totalBadges || 0,
        totalXP,
        activeStreaks: activeStreaks || 0,
        leaderboardEntries: leaderboardEntries || 0,
        avgUserLevel: Math.round(avgUserLevel * 10) / 10
      });
    } catch (error) {
      console.error('Error fetching gamification stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const gamificationSections = [
    {
      title: 'Leaderboard Management',
      description: 'View and manage user rankings, points, and competitive standings',
      icon: Trophy,
      color: 'bg-yellow-500',
      link: '/admin/leaderboard',
      stats: `${stats.leaderboardEntries} entries`
    },
    {
      title: 'Badge Definitions',
      description: 'Create and manage achievement badges and their XP rewards',
      icon: Award,
      color: 'bg-purple-500',
      link: '/admin/badge-definitions',
      stats: `${stats.totalBadges} badges earned`
    },
    {
      title: 'User Experience Points',
      description: 'Monitor user XP progression and level advancement',
      icon: Star,
      color: 'bg-blue-500',
      link: '/admin/user-xp',
      stats: `${stats.totalXP.toLocaleString()} total XP`
    },
    {
      title: 'Streak Management',
      description: 'Track user activity streaks and engagement patterns',
      icon: Flame,
      color: 'bg-orange-500',
      link: '/admin/user-streaks',
      stats: `${stats.activeStreaks} active streaks`
    },
    {
      title: 'Contest System',
      description: 'Manage prediction contests and tournament structures',
      icon: Target,
      color: 'bg-green-500',
      link: '/admin/contests',
      stats: 'Coming soon'
    },
    {
      title: 'Rewards & Incentives',
      description: 'Configure reward systems and achievement milestones',
      icon: Gift,
      color: 'bg-pink-500',
      link: '/admin/rewards',
      stats: 'Coming soon'
    }
  ];

  const quickStats = [
    {
      name: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400'
    },
    {
      name: 'Average Level',
      value: stats.avgUserLevel.toString(),
      icon: TrendingUp,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
    },
    {
      name: 'Total XP Earned',
      value: stats.totalXP.toLocaleString(),
      icon: Zap,
      color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400'
    },
    {
      name: 'Active Streaks',
      value: stats.activeStreaks.toString(),
      icon: Flame,
      color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Gamification Overview</h1>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Crown className="h-6 w-6 mr-2 text-yellow-500" />
            Gamification Overview
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage user engagement, achievements, and competitive features
          </p>
        </div>
        <button
          onClick={fetchGamificationStats}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Refresh Stats
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gamification Sections */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Gamification Management
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {gamificationSections.map((section) => (
            <Link
              key={section.title}
              to={section.link}
              className="group relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600"
            >
              <div className="flex items-center mb-4">
                <div className={`p-3 rounded-lg ${section.color} text-white group-hover:scale-110 transition-transform`}>
                  <section.icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {section.title}
                  </h3>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {section.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {section.stats}
                </span>
                <div className="text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                  →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Recent Gamification Activity
          </h3>
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <Award className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  New badge "First Win" was earned by 12 users today
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Average user level increased to {stats.avgUserLevel}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">5 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {stats.activeStreaks} users are maintaining active streaks
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Gamification System Health
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">98%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Badge System Uptime</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.totalUsers > 0 ? Math.round((stats.totalBadges / stats.totalUsers) * 100) / 100 : 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Badges per User</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.totalUsers > 0 ? Math.round(stats.totalXP / stats.totalUsers) : 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg XP per User</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamificationOverview;