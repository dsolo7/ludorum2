import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AIModel {
  id: string;
  name: string;
  description: string;
  llm_provider_id: string;
  sport_id: string;
  betting_type_id: string;
  api_feed_id: string | null;
  prompt_template: string;
  settings: Record<string, any>;
  is_active: boolean;
}

interface LLMProvider {
  id: string;
  name: string;
}

interface Sport {
  id: string;
  name: string;
}

interface BetType {
  id: string;
  name: string;
}

interface APIFeed {
  id: string;
  name: string;
}

const ModelBuilder: React.FC = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    llm_provider_id: '',
    sport_id: '',
    betting_type_id: '',
    api_feed_id: '',
    prompt_template: '',
    settings: '{}',
    is_active: true
  });

  // Options for dropdowns
  const [llmProviders, setLLMProviders] = useState<LLMProvider[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [betTypes, setBetTypes] = useState<BetType[]>([]);
  const [apiFeeds, setAPIFeeds] = useState<APIFeed[]>([]);

  useEffect(() => {
    fetchModels();
    fetchLLMProviders();
    fetchSports();
    fetchBetTypes();
    fetchAPIFeeds();
  }, []);

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select(`
          *,
          llm_providers (name),
          sports (name),
          betting_types (name),
          api_feeds (name)
        `)
        .order('name');

      if (error) throw error;
      setModels(data || []);
    } catch (error) {
      console.error('Error fetching AI models:', error);
    }
  };

  const fetchLLMProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('llm_providers')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setLLMProviders(data || []);
    } catch (error) {
      console.error('Error fetching LLM providers:', error);
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

  const fetchBetTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('betting_types')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setBetTypes(data || []);
    } catch (error) {
      console.error('Error fetching bet types:', error);
    }
  };

  const fetchAPIFeeds = async () => {
    try {
      const { data, error } = await supabase
        .from('api_feeds')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAPIFeeds(data || []);
    } catch (error) {
      console.error('Error fetching API feeds:', error);
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
      description: '',
      llm_provider_id: '',
      sport_id: '',
      betting_type_id: '',
      api_feed_id: '',
      prompt_template: '',
      settings: '{}',
      is_active: true
    });
    setEditingModel(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let settings;
      try {
        settings = JSON.parse(formData.settings);
      } catch (error) {
        alert('Invalid JSON in settings field');
        return;
      }

      const modelData = {
        name: formData.name,
        description: formData.description,
        llm_provider_id: formData.llm_provider_id,
        sport_id: formData.sport_id,
        betting_type_id: formData.betting_type_id,
        api_feed_id: formData.api_feed_id || null,
        prompt_template: formData.prompt_template,
        settings,
        is_active: formData.is_active
      };

      if (editingModel) {
        const { error } = await supabase
          .from('ai_models')
          .update(modelData)
          .eq('id', editingModel.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ai_models')
          .insert([modelData]);

        if (error) throw error;
      }

      await fetchModels();
      resetForm();
    } catch (error) {
      console.error('Error saving AI model:', error);
      alert('Error saving AI model');
    }
  };

  const handleEdit = (model: AIModel) => {
    setFormData({
      name: model.name,
      description: model.description,
      llm_provider_id: model.llm_provider_id,
      sport_id: model.sport_id,
      betting_type_id: model.betting_type_id,
      api_feed_id: model.api_feed_id || '',
      prompt_template: model.prompt_template,
      settings: JSON.stringify(model.settings, null, 2),
      is_active: model.is_active
    });
    setEditingModel(model);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this AI model?')) return;

    try {
      const { error } = await supabase
        .from('ai_models')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchModels();
    } catch (error) {
      console.error('Error deleting AI model:', error);
      alert('Error deleting AI model');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">AI Model Builder</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Model
        </button>
      </div>

      {/* Form */}
      {isFormOpen && (
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Model Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                  placeholder="e.g., Parlay Evaluator"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  LLM Provider *
                </label>
                <select
                  name="llm_provider_id"
                  value={formData.llm_provider_id}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                >
                  <option value="">Select Provider</option>
                  {llmProviders.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sport *
                </label>
                <select
                  name="sport_id"
                  value={formData.sport_id}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
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
                  Bet Type *
                </label>
                <select
                  name="betting_type_id"
                  value={formData.betting_type_id}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                >
                  <option value="">Select Bet Type</option>
                  {betTypes.map(betType => (
                    <option key={betType.id} value={betType.id}>
                      {betType.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  API Feed *
                </label>
                <select
                  name="api_feed_id"
                  value={formData.api_feed_id}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                >
                  <option value="">No API Feed</option>
                  {apiFeeds.map(feed => (
                    <option key={feed.id} value={feed.id}>
                      {feed.name}
                    </option>
                  ))}
                </select>
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
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                  placeholder="Describe the model's purpose and strengths"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Prompt Template *
                </label>
                <textarea
                  name="prompt_template"
                  value={formData.prompt_template}
                  onChange={handleInputChange}
                  required
                  rows={5}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-2.5"
                  placeholder="Enter your prompt template using Handlebars or raw text"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Model Settings (JSON)
                </label>
                <textarea
                  name="settings"
                  value={formData.settings}
                  onChange={handleInputChange}
                  rows={5}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm font-mono py-2.5"
                  placeholder='{ "temperature": 0.7, "top_p": 1 }'
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Active
                  </label>
                </div>
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
                {editingModel ? 'Update' : 'Create'} Model
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Models List */}
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
                Bet Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Provider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                API Feed
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
            {models.map((model) => (
              <tr key={model.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {model.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {(model as any).sports?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {(model as any).betting_types?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {(model as any).llm_providers?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {(model as any).api_feeds?.name || 'None'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    model.is_active
                      ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300'
                  }`}>
                    {model.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(model)}
                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(model.id)}
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

export default ModelBuilder;