import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AIModel {
  id: string;
  name: string;
}

interface ModelTokenSetting {
  id: string;
  model_id: string;
  tokens_required: number;
  description: string | null;
  ai_models?: {
    name: string;
  };
}

const Tokenize: React.FC = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [tokenSettings, setTokenSettings] = useState<ModelTokenSetting[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<ModelTokenSetting | null>(null);
  const [formData, setFormData] = useState({
    model_id: '',
    tokens_required: 1,
    description: ''
  });

  useEffect(() => {
    fetchModels();
    fetchTokenSettings();
  }, []);

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setModels(data || []);
    } catch (error) {
      console.error('Error fetching AI models:', error);
    }
  };

  const fetchTokenSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('model_token_settings')
        .select(`
          *,
          ai_models (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokenSettings(data || []);
    } catch (error) {
      console.error('Error fetching token settings:', error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 1 : value
    }));
  };

  const resetForm = () => {
    setFormData({
      model_id: '',
      tokens_required: 1,
      description: ''
    });
    setEditingSetting(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const settingData = {
        model_id: formData.model_id,
        tokens_required: formData.tokens_required,
        description: formData.description || null
      };

      if (editingSetting) {
        const { error } = await supabase
          .from('model_token_settings')
          .update(settingData)
          .eq('id', editingSetting.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('model_token_settings')
          .insert([settingData]);

        if (error) throw error;
      }

      await fetchTokenSettings();
      resetForm();
    } catch (error) {
      console.error('Error saving token setting:', error);
      alert('Error saving token setting');
    }
  };

  const handleEdit = (setting: ModelTokenSetting) => {
    setFormData({
      model_id: setting.model_id,
      tokens_required: setting.tokens_required,
      description: setting.description || ''
    });
    setEditingSetting(setting);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this token setting?')) return;

    try {
      const { error } = await supabase
        .from('model_token_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchTokenSettings();
    } catch (error) {
      console.error('Error deleting token setting:', error);
      alert('Error deleting token setting');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Tokenize Model</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tokenize Model
        </button>
      </div>

      {/* Form */}
      {isFormOpen && (
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  AI Model *
                </label>
                <select
                  name="model_id"
                  value={formData.model_id}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                >
                  <option value="">Select AI Model</option>
                  {models.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Token Cost *
                </label>
                <input
                  type="number"
                  name="tokens_required"
                  value={formData.tokens_required}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                  placeholder="Enter token cost"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                  placeholder="Optional notes about this token setting"
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
                {editingSetting ? 'Update' : 'Save'} Token Setting
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Token Settings List */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                AI Model
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Token Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {tokenSettings.map((setting) => (
              <tr key={setting.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {setting.ai_models?.name || 'Unknown Model'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {setting.tokens_required} tokens
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {setting.description || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(setting)}
                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(setting.id)}
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

export default Tokenize;