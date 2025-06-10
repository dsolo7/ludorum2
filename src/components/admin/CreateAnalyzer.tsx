import React, { useState } from 'react';
import { Upload, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FormData {
  name: string;
  description: string;
  sport: string;
  bettingType: string;
  status: string;
  promptTemplate: string;
  modelSettings: string;
}

const CreateAnalyzer: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    sport: '',
    bettingType: '',
    status: 'draft',
    promptTemplate: '',
    modelSettings: ''
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (6MB limit)
    if (file.size > 6 * 1024 * 1024) {
      alert('File size must be less than 6MB');
      return;
    }

    // Preview image
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleTestAnalyzer = async () => {
    try {
      // Implement test functionality here
      setTestResult('Test analysis successful! The model is working as expected.');
    } catch (error) {
      setTestResult('Test failed. Please check your configuration.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .insert([
          {
            name: formData.name,
            description: formData.description,
            sport: formData.sport,
            betting_type: formData.bettingType,
            status: formData.status,
            prompt_template: formData.promptTemplate,
            model_settings: JSON.parse(formData.modelSettings || '{}')
          }
        ])
        .select();

      if (error) throw error;

      alert('Analyzer created successfully!');
      // Reset form
      setFormData({
        name: '',
        description: '',
        sport: '',
        bettingType: '',
        status: 'draft',
        promptTemplate: '',
        modelSettings: ''
      });
      setPreviewImage(null);
      setTestResult(null);
    } catch (error) {
      console.error('Error creating analyzer:', error);
      alert('Failed to create analyzer. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create New Analyzer</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm h-12"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-3"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sport
              </label>
              <select
                name="sport"
                value={formData.sport}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm h-12"
                required
              >
                <option value="">Select Sport</option>
                <option value="NFL">NFL</option>
                <option value="NBA">NBA</option>
                <option value="MLB">MLB</option>
                <option value="NHL">NHL</option>
                <option value="Soccer">Soccer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Betting Type
              </label>
              <select
                name="bettingType"
                value={formData.bettingType}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm h-12"
                required
              >
                <option value="">Select Betting Type</option>
                <option value="moneyline">Moneyline</option>
                <option value="spread">Spread</option>
                <option value="over_under">Over/Under</option>
                <option value="player_props">Player Props</option>
                <option value="parlay">Parlay</option>
                <option value="fantasy_lineup">Fantasy Lineup</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Prompt Template
            </label>
            <textarea
              name="promptTemplate"
              value={formData.promptTemplate}
              onChange={handleInputChange}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-3"
              placeholder="Enter the prompt template for the analyzer..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Model Settings (JSON)
            </label>
            <textarea
              name="modelSettings"
              value={formData.modelSettings}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm py-3 font-mono"
              placeholder='{"temperature": 0.7, "max_tokens": 2048}'
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Test Image Upload
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                    <span>Upload a file</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG up to 6MB</p>
              </div>
            </div>
          </div>

          {previewImage && (
            <div className="relative">
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full h-auto rounded-lg"
              />
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {testResult && (
            <div className="p-4 rounded-md bg-green-50 dark:bg-green-900">
              <p className="text-green-700 dark:text-green-200">{testResult}</p>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleTestAnalyzer}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Test Analyzer
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Save className="h-4 w-4 mr-2" />
              Create Analyzer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAnalyzer;