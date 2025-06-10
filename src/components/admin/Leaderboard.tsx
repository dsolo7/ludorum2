import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Star, TrendingUp, Users, RefreshCw, Calendar, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  rank: number;
  points: number;
  recorded_at: string;
  users?: {
    email: string;
  };
}

interface UserXP {
  user_id: string;
  xp_points: number;
  level: number;
  updated_at: string;
}

const Leaderboard: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [userXPData, setUserXPData] = useState<UserXP[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'xp'>('leaderboard');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7days' | '30days' | '90days' | 'all'>('all');

  useEffect(() => {
    fetchLeaderboardData();
    fetchUserXPData();
  }, [selectedTimeframe]);

  const fetchLeaderboardData = async () => {
    try {
      const timeframeFilter = getTimeframeFilter(selectedTimeframe);
      
      let query = supabase
        .from('leaderboard')
        .select(`
          *,
          users (email)
        `);

      if (timeframeFilter) {
        query = query.gte('recorded_at', timeframeFilter);
      }

      const { data, error } = await query
        .order('rank', { ascending: true })
        .limit(50);

      if (error) throw error;
      setLeaderboardData(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    }
  };

  const fetchUserXPData = async () => {
    try {
      setLoading(true);
      const timeframeFilter = getTimeframeFilter(selectedTimeframe);
      
      let query = supabase
        .from('user_xp')
        .select('*');

      if (timeframeFilter) {
        query = query.gte('updated_at', timeframeFilter);
      }

      const { data, error } = await query
        .order('xp_points', { ascending: false })
        .limit(50);

      if (error) throw error;
      setUserXPData(data || []);
    } catch (error) {
      console.error('Error fetching user XP data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeframeFilter = (timeframe: string): string | null => {
    const now = new Date();
    
    switch (timeframe) {
      case '7days':
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        return sevenDaysAgo.toISOString();
      
      case '30days':
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return thirtyDaysAgo.toISOString();
      
      case '90days':
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(now.getDate() - 90);
        return ninetyDaysAgo.toISOString();
      
      default:
        return null;
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchLeaderboardData(), fetchUserXPData()]);
    setLoading(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-600 dark:text-gray-400">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 50) return 'text-purple-600 dark:text-purple-400';
    if (level >= 25) return 'text-blue-600 dark:text-blue-400';
    if (level >= 10) return 'text-green-600 dark:text-green-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Leaderboard Management</h1>
        </div>
        <div className="animate-pulse">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Trophy className="h-6 w-6 mr-2 text-yellow-500" /> 
            Leaderboard Management
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor user rankings and competitive standings
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          
          <button
            onClick={refreshData}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-400" /> 
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Ranked Users
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {leaderboardData.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Star className="h-8 w-8 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Avg XP per User
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {userXPData.length > 0 
                      ? Math.round(userXPData.reduce((sum, user) => sum + user.xp_points, 0) / userXPData.length)
                      : 0
                    }
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Filter className="h-8 w-8 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Timeframe
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {selectedTimeframe === 'all' ? 'All Time' : 
                     selectedTimeframe === '7days' ? 'Last 7 Days' : 
                     selectedTimeframe === '30days' ? 'Last 30 Days' : 
                     'Last 90 Days'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('leaderboard')} 
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'leaderboard'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Competition Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('xp')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'xp'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            XP Rankings
          </button>
        </nav>
      </div>

      {/* Leaderboard Content */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        {activeTab === 'leaderboard' ? (
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Competition Rankings
            </h3>
            {leaderboardData.length > 0 ? (
              <div className="space-y-3">
                {leaderboardData.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      entry.rank <= 3
                        ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getRankBadgeColor(entry.rank)}`}>
                        {getRankIcon(entry.rank)}
                      </div>
                      <div> 
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {entry.users?.email || `User ${entry.user_id.slice(0, 8)}...`}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Recorded: {new Date(entry.recorded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {entry.points.toLocaleString()} pts
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Rank #{entry.rank}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No leaderboard entries</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Leaderboard entries will appear here as users participate in contests.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Experience Point Rankings
            </h3>
            {userXPData.length > 0 ? (
              <div className="space-y-3">
                {userXPData.map((user, index) => (
                  <div
                    key={user.user_id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      index < 3
                        ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getRankBadgeColor(index + 1)}`}>
                        {getRankIcon(index + 1)}
                      </div>
                      <div> 
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          User {user.user_id.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Updated: {new Date(user.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {user.xp_points.toLocaleString()} XP
                      </p>
                      <p className={`text-sm font-medium ${getLevelColor(user.level)}`}>
                        Level {user.level}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Star className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No XP data</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  User experience points will appear here as users engage with the platform.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;