import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface APIFeed {
  id: string;
  name: string;
  url: string;
  api_key: string;
  sport_id: string | null;
  is_active: boolean;
  refresh_interval: number;
  last_fetch: string | null;
  notes: string | null;
}

interface Sport {
  id: string;
  name: string;
}

const APIFeeds: React.FC = () => {
  const [feeds, setFeeds] = useState<APIFeed[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFeed, setEditingFeed] = useState<APIFeed | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    api_key: '',
    sport_id: '',
    is_active: true,
    refresh_interval: 300,
    notes: ''
  });

  useEffect(() => {
    fetchFeeds();
    fetchSports();
  }, []);

  const fetchFeeds = async () => {
    try {
      const { data, error } = await supabase
        .from('api_feeds')
        .select(`
          *,
          sports (name)
        `)
        .order('name');

      if (error) throw error;
      setFeeds(data || []);
    } catch (error) {
      console.error('Error fetching API feeds:', error);
    }
  };

  const fetchSports = async () => {
    try {
      const { data, error } = await supabase
        .from('sports')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setSports(data || []);
    } catch (error) {
      console.error('Error fetching sports:', error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      api_key: '',
      sport_id: '',
      is_active: true,
      refresh_interval: 300,
      notes: ''
    });
    setEditingFeed(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const feedData = {
        name: formData.name,
        url: formData.url,
        api_key: formData.api_key,
        sport_id: formData.sport_id || null,
        is_active: formData.is_active,
        refresh_interval: parseInt(formData.refresh_interval.toString()),
        notes: formData.notes || null
      };

      if (editingFeed) {
        const { error } = await supabase
          .from('api_feeds')
          .update(feedData)
          .eq('id', editingFeed.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('api_feeds')
          .insert([feedData]);

        if (error) throw error;
      }

      await fetchFeeds();
      resetForm();
    } catch (error) {
      console.error('Error saving API feed:', error);
    }
  };

  const handleEdit = (feed: APIFeed) => {
    setFormData({
      name: feed.name,
      url: feed.url,
      api_key: feed.api_key,
      sport_id: feed.sport_id || '',
      is_active: feed.is_active,
      refresh_interval: feed.refresh_interval,
      notes: feed.notes || ''
    });
    setEditingFeed(feed);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API feed?')) return;

    try {
      const { error } = await supabase
        .from('api_feeds')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchFeeds();
    } catch (error) {
      console.error('Error deleting API feed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">API Feeds</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Feed
        </button>
      </div>

      {/* Form */}
      {isFormOpen && (
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Feed Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm h-12"
                  placeholder="e.g., NFL Stats API"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sport
                </label>
                <select
                  name="sport_id"
                  value={formData.sport_id}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm h-12"
                >
                  <option value="">Select Sport</option>
                  {sports.map(sport => (
                    <option key={sport.id} value={sport.id}>
                      {sport.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  API URL *
                </label>
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm h-12"
                  placeholder="https://api.example.com/v1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  API Key *
                </label>
                <input
                  type="text"
                  name="api_key"
                  value={formData.api_key}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm h-12"
                  placeholder="Enter API key"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Refresh Interval (seconds) *
                </label>
                <input
                  type="number"
                  name="refresh_interval"
                  value={formData.refresh_interval}
                  onChange={handleInputChange}
                  required
                  min="60"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm h-12"
                />
              </div>

              <div className="flex items-center h-12 mt-8">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  placeholder="Additional notes about this API feed"
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
                {editingFeed ? 'Update' : 'Save'} Feed
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feeds List */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Sport
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                URL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Refresh Interval
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {feeds.map((feed) => (
              <tr key={feed.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {feed.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {(feed as any).sports?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {feed.url}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {feed.refresh_interval}s
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    feed.is_active
                      ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300'
                  }`}>
                    {feed.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(feed)}
                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(feed.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default APIFeeds;