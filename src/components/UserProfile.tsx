import React, { useState, useEffect } from 'react';
import { 
  User, 
  Camera,
  Upload,
  Mail, 
  Calendar,
  Clock,
  Award, 
  Star, 
  Coins, 
  TrendingUp, 
  Flame,
  Target,
  ThumbsUp,
  Trophy,
  Settings,
  Edit,
  Save,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import AnimatedTokenCounter from './AnimatedTokenCounter';
import AchievementNotification from './AchievementNotification';
import useAchievements from '../hooks/useAchievements'; 

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  profile_image: string | null;
  created_at: string;
}

interface UserXP {
  xp_points: number;
  level: number;
}

interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badge_definitions: {
    name: string;
    description: string;
    image_url: string | null;
  };
}

const UserProfile: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [userTokens, setUserTokens] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    profile_image: null as File | null
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { userStats, newAchievements, clearNewAchievements } = useAchievements();
  const [showAchievementNotification, setShowAchievementNotification] = useState(false);
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState(0);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (newAchievements.length > 0) {
      setShowAchievementNotification(true);
    }
  }, [newAchievements]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Fetch user from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') throw userError;

      // Fetch XP
      const { data: xpData, error: xpError } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (xpError && xpError.code !== 'PGRST116') throw xpError;

      // Fetch badges
      const { data: badges, error: badgesError } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge_definitions (name, description, image_url)
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (badgesError) throw badgesError;

      // Fetch tokens
      const { data: tokens, error: tokensError } = await supabase
        .from('user_tokens')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (tokensError && tokensError.code !== 'PGRST116') throw tokensError;

      // Combine data
      const combinedUserData = {
        id: user.id,
        email: profile?.email || user.email || '',
        full_name: userData?.full_name || null,
        profile_image: userData?.profile_image || null,
        created_at: userData?.created_at || profile?.created_at || user.created_at
      };

      setUserData(combinedUserData);
      setEditForm({
        full_name: combinedUserData.full_name || '',
        email: combinedUserData.email,
        profile_image: null
      });
      setImagePreview(combinedUserData.profile_image);
      setUserXP(xpData || { xp_points: 0, level: 1 });
      setUserBadges(badges || []);
      setUserTokens(tokens?.balance || 0);

    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Check file type
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      alert('Only JPEG, PNG, and GIF images are allowed');
      return;
    }

    setEditForm({ ...editForm, profile_image: file });

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadProfileImage = async (userId: string, file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      alert('Failed to upload profile image. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!userData) return;

      let profileImageUrl = userData.profile_image;

      // Upload new profile image if selected
      if (editForm.profile_image) {
        const uploadedUrl = await uploadProfileImage(userData.id, editForm.profile_image);
        if (uploadedUrl) {
          profileImageUrl = uploadedUrl;
        }
      }

      // Update users table
      const { error: userError } = await supabase
        .from('users')
        .update({
          full_name: editForm.full_name,
          profile_image: profileImageUrl
        })
        .eq('id', userData.id);

      if (userError) throw userError;

      // Update auth email if changed
      if (editForm.email !== userData.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: editForm.email
        });

        if (emailError) throw emailError;
      }

      // Refresh user data
      await fetchUserProfile();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleAchievementNotificationClose = () => {
    setShowAchievementNotification(false);
    
    // Move to next achievement if there are more
    if (currentAchievementIndex < newAchievements.length - 1) {
      setCurrentAchievementIndex(currentAchievementIndex + 1);
      setTimeout(() => {
        setShowAchievementNotification(true);
      }, 500);
    } else {
      // Reset when all achievements have been shown
      setCurrentAchievementIndex(0);
      clearNewAchievements();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Show achievement notification if there are new achievements */}
      {showAchievementNotification && newAchievements.length > 0 && (
        <AchievementNotification
          achievement={newAchievements[currentAchievementIndex]}
          isVisible={showAchievementNotification}
          onClose={handleAchievementNotificationClose}
        />
      )}

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center mr-6">
                {userData?.profile_image ? (
                  <div className="relative h-20 w-20">
                    <img
                      src={userData.profile_image}
                      alt={userData.full_name || 'User'}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                    {isEditing && (
                      <label 
                        htmlFor="profile-image-upload" 
                        className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors"
                      >
                        <Camera className="h-4 w-4" />
                      </label>
                    )}
                  </div>
                ) : (
                  <div className="relative h-20 w-20 flex items-center justify-center">
                    <User className="h-10 w-10 text-indigo-500" />
                    {isEditing && (
                      <label 
                        htmlFor="profile-image-upload" 
                        className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors"
                      >
                        <Camera className="h-4 w-4" />
                      </label>
                    )}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {userData?.full_name || 'User'}
                </h1>
                <div className="flex items-center text-indigo-100">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{userData?.email}</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                <div className="text-2xl font-bold text-white">{userXP?.level || 1}</div>
                <div className="text-xs text-indigo-100">Level</div>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                <div className="text-2xl font-bold text-white">{userBadges.length}</div>
                <div className="text-xs text-indigo-100">Badges</div>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                <div className="text-2xl font-bold text-white">{userTokens}</div>
                <div className="text-xs text-indigo-100">Tokens</div>
              </div>
            </div>
          </div>
          
          {/* XP Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-300 mr-1" />
                <span className="text-sm text-white">XP Progress</span>
              </div>
              <span className="text-sm text-white">
                {userXP?.xp_points || 0}/{(userXP?.level || 1) * 1000} XP
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-yellow-300 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${((userXP?.xp_points || 0) % 1000) / 10}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Info */}
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <User className="h-5 w-5 mr-2 text-indigo-500" />
              User Information
            </h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              {isEditing ? (
                <X className="h-5 w-5" />
              ) : (
                <Edit className="h-5 w-5" />
              )}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Hidden file input */}
              <input
                type="file"
                id="profile-image-upload"
                accept="image/jpeg,image/png,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {/* Image preview */}
              {imagePreview && (
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Profile preview"
                      className="h-24 w-24 rounded-full object-cover border-2 border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setEditForm({ ...editForm, profile_image: null });
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</h3>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {userData?.full_name || 'Not set'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h3>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {userData?.email}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</h3>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Account ID</h3>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {userData?.id.substring(0, 8)}...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Token Balance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-6">
            <Coins className="h-5 w-5 mr-2 text-yellow-500" />
            Token Balance
          </h2>
          
          <div className="flex items-center justify-center mb-6">
            <div className="text-center">
              <AnimatedTokenCounter
                startValue={0}
                endValue={userTokens}
                isAnimating={true}
                showChange={false}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Available Tokens
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
              Buy More Tokens
            </button>
            <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              View Transaction History
            </button>
          </div>
        </div>
      </div>

      {/* Stats & Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-4">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
            Your Stats
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userXP?.xp_points || 0}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total XP
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userXP?.level || 1}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Current Level
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userBadges.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Badges Earned
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center">
                <Flame className="h-5 w-5 text-orange-500 mr-1" /> 
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userStats?.current_streak || 0}
                </span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Day Streak
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-500 mr-1" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userStats?.total_predictions || 0}
                </span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Predictions Made
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userStats?.correct_predictions && userStats?.total_predictions 
                  ? Math.round((userStats.correct_predictions / userStats.total_predictions) * 100) 
                  : 0}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Accuracy Rate
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center">
                <Flame className="h-5 w-5 text-red-500 mr-1" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userStats?.longest_streak || 0}
                </span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Longest Streak
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center">
                <Coins className="h-5 w-5 text-yellow-500 mr-1" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userStats?.tokens_spent || 0}
                </span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Tokens Spent
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center">
                <ThumbsUp className="h-5 w-5 text-green-500 mr-1" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userStats?.social_votes || 0}
                </span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Social Votes
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center">
                <Trophy className="h-5 w-5 text-amber-500 mr-1" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userStats?.contests_won || 0}
                </span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Contests Won
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center">
                <Clock className="h-5 w-5 text-indigo-500 mr-1" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userStats?.days_active || 1}
                </span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Days Active
              </div>
            </div>
          </div>
          
          {/* Stats Explanation */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
              About Your Stats
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              These statistics reflect your activity and performance on the platform. Continue engaging with predictions, contests, and analyses to improve your stats and unlock more achievements!
            </p>
          </div>
        </div>

        {/* Recent Badges */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-6">
            <Award className="h-5 w-5 mr-2 text-purple-500" />
            Recent Badges
          </h2>
          
          {userBadges.length > 0 ? (
            <div className="space-y-4">
              {userBadges.slice(0, 3).map((badge) => (
                <div key={badge.id} className="flex items-center">
                  <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mr-3">
                    <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div> 
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {badge.badge_definitions.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(badge.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {userBadges.length > 3 && (
                <button className="w-full text-center text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 mt-2">
                  View all {userBadges.length} badges
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Award className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No badges earned yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-6">
          <Settings className="h-5 w-5 mr-2 text-gray-500" />
          Account Settings
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Receive email updates about your account
              </p>
            </div>
            <div className="relative inline-block w-10 mr-2 align-middle select-none">
              <input 
                type="checkbox" 
                name="toggle" 
                id="email-toggle" 
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-gray-300 appearance-none cursor-pointer"
              />
              <label 
                htmlFor="email-toggle" 
                className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
              ></label>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Add an extra layer of security to your account
              </p>
            </div>
            <button className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50">
              Enable
            </button>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Delete Account</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Permanently delete your account and all data
              </p>
            </div>
            <button className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;