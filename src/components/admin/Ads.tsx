import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, X, ExternalLink, Eye, MousePointer } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Ad {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  text_content: string | null;
  target_url: string;
  sport_category: string | null;
  ad_type: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
}

interface AdStats {
  impressions: number;
  clicks: number;
  ctr: number;
}

const Ads: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [adStats, setAdStats] = useState<Record<string, AdStats>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    text_content: '',
    target_url: '',
    sport_category: '',
    ad_type: 'sponsored',
    is_active: true,
    end_date: '',
    priority: 0
  });

  const sportCategories = ['NFL', 'NBA', 'MLB', 'NHL', 'Soccer'];
  const adTypes = ['banner', 'sponsored', 'promo'];

  useEffect(() => {
    fetchAds();
    fetchAdStats();
  }, []);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
    }
  };

  const fetchAdStats = async () => {
    try {
      // Get impression counts
      const { data: impressions, error: impressionError } = await supabase
        .from('ad_impressions')
        .select('ad_id')
        .gte('viewed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (impressionError) throw impressionError;

      // Get click counts
      const { data: clicks, error: clickError } = await supabase
        .from('ad_clicks')
        .select('ad_id')
        .gte('clicked_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (clickError) throw clickError;

      // Calculate stats
      const stats: Record<string, AdStats> = {};
      
      // Count impressions
      impressions?.forEach(impression => {
        if (!stats[impression.ad_id]) {
          stats[impression.ad_id] = { impressions: 0, clicks: 0, ctr: 0 };
        }
        stats[impression.ad_id].impressions++;
      });

      // Count clicks
      clicks?.forEach(click => {
        if (!stats[click.ad_id]) {
          stats[click.ad_id] = { impressions: 0, clicks: 0, ctr: 0 };
        }
        stats[click.ad_id].clicks++;
      });

      // Calculate CTR
      Object.keys(stats).forEach(adId => {
        const stat = stats[adId];
        stat.ctr = stat.impressions > 0 ? (stat.clicks / stat.impressions) * 100 : 0;
      });

      setAdStats(stats);
    } catch (error) {
      console.error('Error fetching ad stats:', error);
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
      title: '',
      description: '',
      image_url: '',
      text_content: '',
      target_url: '',
      sport_category: '',
      ad_type: 'sponsored',
      is_active: true,
      end_date: '',
      priority: 0
    });
    setEditingAd(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const adData = {
        title: formData.title,
        description: formData.description || null,
        image_url: formData.image_url || null,
        text_content: formData.text_content || null,
        target_url: formData.target_url,
        sport_category: formData.sport_category || null,
        ad_type: formData.ad_type,
        is_active: formData.is_active,
        end_date: formData.end_date || null,
        priority: parseInt(formData.priority.toString()) || 0
      };

      if (editingAd) {
        const { error } = await supabase
          .from('ads')
          .update(adData)
          .eq('id', editingAd.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ads')
          .insert([adData]);

        if (error) throw error;
      }

      await fetchAds();
      resetForm();
    } catch (error) {
      console.error('Error saving ad:', error);
      alert('Error saving ad');
    }
  };

  const handleEdit = (ad: Ad) => {
    setFormData({
      title: ad.title,
      description: ad.description || '',
      image_url: ad.image_url || '',
      text_content: ad.text_content || '',
      target_url: ad.target_url,
      sport_category: ad.sport_category || '',
      ad_type: ad.ad_type,
      is_active: ad.is_active,
      end_date: ad.end_date ? ad.end_date.split('T')[0] : '',
      priority: ad.priority
    });
    setEditingAd(ad);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;

    try {
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAds();
    } catch (error) {
      console.error('Error deleting ad:', error);
      alert('Error deleting ad');
    }
  };

  const toggleAdStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('ads')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      await fetchAds();
    } catch (error) {
      console.error('Error updating ad status:', error);
      alert('Error updating ad status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Ad Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage affiliate ads and sponsored content
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Ad
        </button>
      </div>

      {/* Form */}
      {isFormOpen && (
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                  placeholder="Ad title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Target URL *
                </label>
                <input
                  type="url"
                  name="target_url"
                  value={formData.target_url}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sport Category
                </label>
                <select
                  name="sport_category"
                  value={formData.sport_category}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                >
                  <option value="">All Sports</option>
                  {sportCategories.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ad Type *
                </label>
                <select
                  name="ad_type"
                  value={formData.ad_type}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                >
                  {adTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
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
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Priority
                </label>
                <input
                  type="number"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  End Date
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                />
              </div>

              <div className="flex items-center h-10">
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
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  placeholder="Ad description"
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
                {editingAd ? 'Update' : 'Create'} Ad
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ads List */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Performance (30d)
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
            {ads.map((ad) => {
              const stats = adStats[ad.id] || { impressions: 0, clicks: 0, ctr: 0 };
              return (
                <tr key={ad.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {ad.image_url && (
                        <img
                          src={ad.image_url}
                          alt={ad.title}
                          className="h-10 w-10 rounded object-cover mr-3"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {ad.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Priority: {ad.priority}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {ad.sport_category || 'All Sports'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {ad.ad_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {stats.impressions}
                      </div>
                      <div className="flex items-center">
                        <MousePointer className="h-4 w-4 mr-1" />
                        {stats.clicks}
                      </div>
                      <div>
                        CTR: {stats.ctr.toFixed(1)}%
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleAdStatus(ad.id, ad.is_active)}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ad.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}
                    >
                      {ad.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <a
                        href={ad.target_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handleEdit(ad)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {ads.length === 0 && (
          <div className="text-center py-12">
            <ExternalLink className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No ads</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating your first ad campaign.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ads;