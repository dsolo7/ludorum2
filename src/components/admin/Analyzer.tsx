import React, { useState, useEffect } from 'react';
import { Upload, Brain, Zap, AlertCircle, CheckCircle, Camera, FileImage, Coins, Play } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface AIModel {
  id: string;
  name: string;
  description: string;
  sport_id: string;
  betting_type_id: string;
  llm_provider_id: string;
  prompt_template: string;
  is_active: boolean;
  settings: any;
  api_feed_id?: string;
  sports?: { name: string };
  betting_types?: { name: string };
  llm_providers?: { name: string };
  api_feeds?: { name: string; url: string };
}

const Analyzer: React.FC = () => {
  const [aiModels, setAiModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiData, setApiData] = useState<any>(null);
  const [isLoadingApiData, setIsLoadingApiData] = useState(false);
  const [userTokens, setUserTokens] = useState<number>(0);
  const [tokenCost, setTokenCost] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAIModels();
    fetchUserTokens();
  }, []);

  const fetchAIModels = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select(`
          *,
          sports (name),
          betting_types (name),
          llm_providers (name),
          api_feeds (name, url)
        `)
        .eq('is_active', true);

      if (error) throw error;
      setAiModels(data || []);
    } catch (error) {
      console.error('Error fetching AI models:', error);
    }
  };

  const fetchUserTokens = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_tokens')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user tokens:', error);
        return;
      }

      setUserTokens(data?.balance || 0);
    } catch (error) {
      console.error('Error fetching user tokens:', error);
    }
  };

  const fetchTokenCost = async (modelId: string) => {
    try {
      const { data, error } = await supabase
        .from('model_token_settings')
        .select('tokens_required')
        .eq('model_id', modelId)
        .single();

      if (error) {
        console.error('Error fetching token cost:', error);
        setTokenCost(1); // Default cost
        return;
      }

      setTokenCost(data?.tokens_required || 1);
    } catch (error) {
      console.error('Error fetching token cost:', error);
      setTokenCost(1);
    }
  };

  const handleModelSelect = async (modelId: string) => {
    const model = aiModels.find(m => m.id === modelId);
    if (model) {
      setSelectedModel(model);
      await fetchTokenCost(modelId);
      
      // If model has API feed, load data
      if (model.api_feed_id) {
        await loadApiData(model);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!selectedModel) {
      alert('Please select an AI model');
      return;
    }

    if (userTokens < tokenCost) {
      alert('Insufficient tokens. Please upgrade your plan or purchase more tokens.');
      return;
    }

    if (!uploadedImage && !inputText.trim()) {
      alert('Please upload an image or enter some text to analyze');
      return;
    }

    setIsAnalyzing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to use the analyzer');
        return;
      }

      // Call the edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-analyzer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          model_id: selectedModel.id,
          image_url: uploadedImage,
          input_text: inputText.trim() || null,
          metadata: {
            api_data: apiData,
            timestamp: new Date().toISOString()
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Analysis failed');
      }

      // Update user token balance
      setUserTokens(result.remaining_balance);

      // Redirect to results page
      navigate(`/analyzer-results?request_id=${result.request_id}`);

    } catch (error) {
      console.error('Analysis error:', error);
      alert(error instanceof Error ? error.message : 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const simulateApiCall = async () => {
    setIsLoadingApiData(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock API data
      const mockData = {
        games: [
          {
            id: 1,
            home_team: "Lakers",
            away_team: "Warriors",
            spread: -3.5,
            over_under: 225.5,
            moneyline: { home: -150, away: +130 }
          },
          {
            id: 2,
            home_team: "Celtics",
            away_team: "Heat",
            spread: -2.0,
            over_under: 210.0,
            moneyline: { home: -120, away: +100 }
          }
        ],
        last_updated: new Date().toISOString()
      };
      
      setApiData(mockData);
    } catch (error) {
      console.error('Error loading API data:', error);
    } finally {
      setIsLoadingApiData(false);
    }
  };

  const loadApiData = async (model: AIModel) => {
    if (!model.api_feeds?.url) return;
    
    setIsLoadingApiData(true);
    try {
      // In a real implementation, you would call the actual API
      // For now, we'll simulate the call
      await simulateApiCall();
    } catch (error) {
      console.error('Error loading API data:', error);
    } finally {
      setIsLoadingApiData(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `analyzer-uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('analyzer-uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('analyzer-uploads')
        .getPublicUrl(filePath);

      setUploadedImage(data.publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Analyzer</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Upload betting slips or enter text to get AI-powered analysis and recommendations.
        </p>
      </div>

      {/* Section 1: Model Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Brain className="h-6 w-6 text-indigo-600 mr-2" />
          Select AI Model
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiModels.map((model) => (
            <div
              key={model.id}
              onClick={() => handleModelSelect(model.id)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedModel?.id === model.id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <h3 className="font-medium text-gray-900 dark:text-white">{model.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{model.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  {model.sports?.name}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  {model.betting_types?.name}
                </span>
              </div>
              {selectedModel?.id === model.id && (
                <div className="mt-2">
                  <CheckCircle className="h-5 w-5 text-indigo-600" />
                </div>
              )}
            </div>
          ))}
        </div>

        {aiModels.length === 0 && (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No AI models available. Please contact an administrator.</p>
          </div>
        )}
      </div>

      {/* Section 2: Input Methods */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Input Data
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Upload */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              Upload Image
            </h3>
            
            {uploadedImage ? (
              <div className="relative">
                <img
                  src={uploadedImage}
                  alt="Uploaded betting slip"
                  className="w-full h-64 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                />
                <button
                  onClick={() => setUploadedImage(null)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Upload a betting slip or screenshot
                </p>
                <label className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isLoading}
                  />
                </label>
                {isLoading && (
                  <div className="mt-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Text Input */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Additional Information
            </h3>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter any additional context, questions, or specific details about your bet..."
              className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>
        </div>

        {/* API Data Display */}
        {selectedModel?.api_feeds && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Live Data Feed: {selectedModel.api_feeds.name}
              </h3>
              <button
                onClick={simulateApiCall}
                disabled={isLoadingApiData}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isLoadingApiData ? 'Loading...' : 'Refresh Data'}
              </button>
            </div>
            
            {isLoadingApiData ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading live data...</span>
              </div>
            ) : apiData ? (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-auto">
                  {JSON.stringify(apiData, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-center p-4 text-gray-500 dark:text-gray-400">
                No data loaded. Click "Refresh Data" to load live information.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 3: Analyze Button + Token Usage */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Ready to Analyze
        </h2>
        
        {/* Token Cost Display */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Analysis Cost
            </span>
            <div className="flex items-center">
              <Coins className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {tokenCost} tokens
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Your Balance
            </span>
            <div className="flex items-center">
              <Coins className="h-4 w-4 text-yellow-500 mr-1" />
              <span className={`text-sm font-medium ${
                userTokens >= tokenCost 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {userTokens} tokens
              </span>
            </div>
          </div>
          {userTokens < tokenCost && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">
                Insufficient tokens. You need {tokenCost - userTokens} more tokens to run this analysis.
              </p>
            </div>
          )}
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !selectedModel || userTokens < tokenCost || (!uploadedImage && !inputText.trim())}
          className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Analyzing...
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              Run Analysis ({tokenCost} tokens)
            </>
          )}
        </button>

        {/* Requirements */}
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <p className="mb-1">Requirements:</p>
          <ul className="list-disc list-inside space-y-1">
            <li className={selectedModel ? 'text-green-600 dark:text-green-400' : ''}>
              Select an AI model
            </li>
            <li className={uploadedImage || inputText.trim() ? 'text-green-600 dark:text-green-400' : ''}>
              Upload an image or enter text
            </li>
            <li className={userTokens >= tokenCost ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              Have sufficient tokens ({tokenCost} required)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Analyzer;