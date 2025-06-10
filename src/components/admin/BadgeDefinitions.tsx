import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, X, Award, Star, Image } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  xp_reward: number;
}

const BadgeDefinitions: React.FC = () => {
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeDefinition | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    image_url: '',
    xp_reward: 100
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('badge_definitions')
        .select('*')
        .order('name');

      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      image_url: '',
      xp_reward: 100
    });
    setEditingBadge(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const badgeData = {
        id: formData.id || formData.name.toLowerCase().replace(/\s+/g, '_'),
        name: formData.name,
        description: formData.description,
        image_url: formData.image_url || null,
        xp_reward: formData.xp_reward
      };

      if (editingBadge) {
        const { error } = await supabase
          .from('badge_definitions')
          .update(badgeData)
          .eq('id', editingBadge.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('badge_definitions')
          .insert([badgeData]);

        if (error) throw error;
      }

      await fetchBadges();
      resetForm();
    } catch (error) {
      console.error('Error saving badge:', error);
      alert('Error saving badge definition');
    }
  };

  const handleEdit = (badge: BadgeDefinition) => {
    setFormData({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      image_url: badge.image_url || '',
      xp_reward: badge.xp_reward
    });
    setEditingBadge(badge);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this badge definition?')) return;

    try {
      const { error } = await supabase
        .from('badge_definitions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchBadges();
    } catch (error) {
      console.error('Error deleting badge:', error);
      alert('Error deleting badge definition');
    }
  };

  const predefinedBadges = [
    {
      id: 'first_win',
      name: 'First Win',
      description: 'Earned your first correct prediction',
      xp_reward: 100
    },
    {
      id: 'streak_master',
      name: 'Streak Master',
      description: 'Maintained a 7-day activity streak',
      xp_reward: 250
    },
    {
      id: 'contest_champion',
      name: 'Contest Champion',
      description: 'Won your first prediction contest',
      xp_reward: 500
    },
    {
      id: 'social_butterfly',
      name: 'Social Butterfly',
      description: 'Voted on 50 community predictions',
      xp_reward: 150
    },
    {
      id: 'high_roller',
      name: 'High Roller',
      description: 'Spent 1000 tokens on AI analysis',
      xp_reward: 300
    },
    {
      id: 'accuracy_ace',
      name: 'Accuracy Ace',
      description: 'Achieved 80% prediction accuracy over 20 bets',
      xp_reward: 750
    }
  ];

  const addPredefinedBadge = async (badge: any) => {
    try {
      const { error } = await supabase
        .from('badge_definitions')
        .insert([badge]);

      if (error) throw error;
      await fetchBadges();
    } catch (error) {
      console.error('Error adding predefined badge:', error);
      alert('Error adding predefined badge');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Badge Definitions</h1>
        </div>
        <div className="animate-pulse">
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Award className="h-6 w-6 mr-2 text-purple-500" />
            Badge Definitions
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create and manage achievement badges and their XP rewards
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Badge
        </button>
      </div>

      {/* Form */}
      {isFormOpen && (
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Badge ID *
                </label>
                <input
                  type="text"
                  name="id"
                  value={formData.id}
                  onChange={handleInputChange}
                  required
                  disabled={!!editingBadge}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5 disabled:opacity-50"
                  placeholder="e.g., first_win"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Unique identifier for this badge (lowercase, underscores only)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Badge Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                  placeholder="e.g., First Win"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  placeholder="Describe how this badge is earned"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Image URL
                </label>
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                  placeholder="https://example.com/badge.png"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  XP Reward *
                </label>
                <input
                  type="number"
                  name="xp_reward"
                  value={formData.xp_reward}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                  placeholder="100"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingBadge ? 'Update' : 'Create'} Badge
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Predefined Badges */}
      {badges.length === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-200 mb-4">
            Quick Start: Add Predefined Badges
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
            Get started quickly by adding these common achievement badges:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {predefinedBadges.map((badge) => (
              <button
                key={badge.id}
                onClick={() => addPredefinedBadge(badge)}
                className="text-left p-3 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
              >
                <div className="font-medium text-gray-900 dark:text-white">{badge.name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{badge.description}</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">{badge.xp_reward} XP</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  {badge.image_url ? (
                    <img
                      src={badge.image_url}
                      alt={badge.name}
                      className="h-12 w-12 rounded-lg object-cover mr-3"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {badge.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ID: {badge.id}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(badge)}
                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(badge.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                {badge.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {badge.xp_reward} XP
                  </span>
                </div>
                {badge.image_url && (
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Image className="h-3 w-3 mr-1" />
                    Has Image
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {badges.length === 0 && (
        <div className="text-center py-12">
          <Award className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No badges defined</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating your first achievement badge.
          </p>
        </div>
      )}
    </div>
  );
};

export default BadgeDefinitions;