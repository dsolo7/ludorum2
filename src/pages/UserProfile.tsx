import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Coins, Award, Calendar, User, Settings, Bell, Clock, Shield } from 'lucide-react';
import UserAchievements from '../components/UserAchievements';
import AnimatedTokenCounter from '../components/AnimatedTokenCounter';
import AchievementNotification from '../components/AchievementNotification';
import useAchievements from '../hooks/useAchievements';
import UserDashboardHeader from '../components/UserDashboardHeader';

const UserProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'achievements' | 'tokens' | 'settings'>('achievements');
  const [user, setUser] = useState<any>(null);
  const [userTokens, setUserTokens] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showAchievementNotification, setShowAchievementNotification] = useState(false);
  const [newBadge, setNewBadge] = useState<any>(null);
  
  const { userStats, newAchievements, updateStats } = useAchievements();

  useEffect(() => {
    fetchUserData();
    updateUserStreak();
  }, []);

  useEffect(() => {
    if (newAchievements.length > 0) {
      setNewBadge(newAchievements[0]);
      setShowAchievementNotification(true);
    }
  }, [newAchievements]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not found');
      }
      
      setUser(user);
      
      // Get user tokens
      const { data: tokens, error: tokensError } = await supabase
        .from('user_tokens')
        .select('balance')
        .eq('user_id', user.id)
        .single();
      
      if (!tokensError) {
        setUserTokens(tokens?.balance || 0);
      }
      
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Call the update-user-streak edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-user-streak`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id })
      });
      
      const result = await response.json();
      
      if (result.badge_awarded) {
        // Update stats to reflect new achievements
        updateStats();
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <UserDashboardHeader />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Profile
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View your achievements, tokens, and account settings
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start">
            <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-4xl font-bold mb-4 md:mb-0 md:mr-6">
              {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U'}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user?.user_metadata?.full_name || 'User'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
              
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
                <div className="flex items-center">
                  <Coins className="h-5 w-5 text-yellow-500 mr-2" />
                  <AnimatedTokenCounter
                    startValue={0}
                    endValue={userTokens}
                    isAnimating={true}
                  />
                </div>
                
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-purple-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {user?.badges_count || 0} Badges
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Member since {new Date(user?.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('achievements')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'achievements'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Achievements
              </div>
            </button>
            <button
              onClick={() => setActiveTab('tokens')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tokens'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Coins className="h-5 w-5 mr-2" />
                Tokens
              </div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'achievements' && (
          <UserAchievements userId={user?.id} />
        )}

        {activeTab === 'tokens' && (
          <div className="space-y-6">
            {/* Token Balance */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Coins className="h-5 w-5 mr-2 text-yellow-500" />
                Token Balance
              </h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Balance</p>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    <AnimatedTokenCounter
                      startValue={0}
                      endValue={userTokens}
                      isAnimating={true}
                      showChange={false}
                    />
                  </div>
                </div>
                
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                  Buy More Tokens
                </button>
              </div>
            </div>

            {/* Token History */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-500" />
                Token History
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {/* Sample token history entries */}
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date().toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          Earned
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                        +100
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        Monthly subscription
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(Date.now() - 86400000).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                          Used
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                        -10
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        NFL Analyzer
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Account Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-indigo-500" />
                Account Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    defaultValue={user?.user_metadata?.full_name || ''}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    defaultValue={user?.email || ''}
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <button className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 text-sm font-medium">
                    Change Password
                  </button>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Bell className="h-5 w-5 mr-2 text-indigo-500" />
                Notification Settings
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="email_notifications"
                      type="checkbox"
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      defaultChecked
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="email_notifications" className="font-medium text-gray-700 dark:text-gray-300">
                      Email Notifications
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">
                      Receive emails about new features, contest results, and important updates.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="achievement_notifications"
                      type="checkbox"
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      defaultChecked
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="achievement_notifications" className="font-medium text-gray-700 dark:text-gray-300">
                      Achievement Notifications
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">
                      Receive notifications when you earn new badges or level up.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-indigo-500" />
                Privacy Settings
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="public_profile"
                      type="checkbox"
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      defaultChecked
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="public_profile" className="font-medium text-gray-700 dark:text-gray-300">
                      Public Profile
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">
                      Allow other users to see your achievements and contest entries.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="data_collection"
                      type="checkbox"
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      defaultChecked
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="data_collection" className="font-medium text-gray-700 dark:text-gray-300">
                      Data Collection
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">
                      Allow us to collect usage data to improve our services.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Achievement Notification */}
      <AchievementNotification
        badge={newBadge}
        isVisible={showAchievementNotification}
        onClose={() => setShowAchievementNotification(false)}
      />
    </div>
  );
};

export default UserProfile;